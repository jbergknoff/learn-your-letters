"use strict";

const random_choice = (list) => {
	return list[~~(Math.random() * list.length)];
};

const ChallengeDisplay = (props) => {
	const styles = {
		position: "fixed",
		left: 0,
		top: 0,
		width: "100%",
		height: "100%",
		padding: 0,
		margin: 0,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: "30em",
		background: "slategrey",
		color: "white"
	};

	return React.createElement("div", { style: styles }, props.value);
};

class Transcript extends React.Component {
	shouldComponentUpdate(new_props) {
		return new_props.transcript.text != this.props.transcript.text;
	}

	render() {
		const styles = {
			position: "absolute",
			left: "1em",
			bottom: "1em",
			fontSize: "3em",
			animation: `fade-out ${this.props.transcript.timeout_ms}ms ease`
		};

		return React.createElement("div", { style: styles }, `Heard: ${this.props.transcript.text}`);
	}
}

const Fireworks = () => {
	return React.createElement(
		"div", { className: "pyro" },
		React.createElement("div", { className: "before" }),
		React.createElement("div", { className: "after" })
	);
};

const ListeningIndicator = () => {
	return React.createElement(
		"div", { style: { position: "absolute", top: "1em", right: "1em", textAlign: "center" } },
		React.createElement("div", { style: { fontSize: "6em" } }, "\u{1F399}"),
		React.createElement("div", null, "Listening")
	);
};

class Game extends React.Component {
	constructor() {
		super()
		this.state = {
			challenge_pool: [],
			challenge: null,
			speech_recognition_instance: null,
			listening: false,
			transcript: null,
			victory: false,
			page_hidden: false
		};
	}

	pause_listening() {
		if (!this.state.speech_recognition_instance) {
			return;
		}

		this.state.speech_recognition_instance.abort();
	}

	resume_listening() {
		if (!this.state.speech_recognition_instance || this.state.listening) {
			return;
		}

		if (this.state.page_hidden) {
			return;
		}

		try {
			this.state.speech_recognition_instance.start();
		} catch (e) {
			console.log("Failed to start listening:", e);
		}
	}

	// options: object with
	//		text: string
	//		pitch: optional number between 0 and 2.
	speak(options, callback) {
		const utterance = new SpeechSynthesisUtterance(options.text);
		// Workaround for Chrome garbage collection causing "end" event to fail to fire.
		// https://bugs.chromium.org/p/chromium/issues/detail?id=509488#c11
		window.utterance = utterance;

		if (typeof options.pitch !== "undefined") {
			utterance.pitch = options.pitch;
		}

		utterance.onend = () => {
			this.resume_listening();

			if (callback) {
				callback();
			}
		};

		this.pause_listening();
		speechSynthesis.speak(utterance);
	}

	set_challenge() {
		const existing_challenge_value = (this.state.challenge || {}).value;
		let challenge;
		while (true) {
			challenge = random_choice(this.state.challenge_pool);
			if (challenge.value !== existing_challenge_value) {
				break;
			}
		}

		const type = /^[A-Z]$/.test(challenge.value) ? "letter" : "number";
		this.setState({ challenge: challenge, victory: false });
		this.speak({ text: `What ${type} is this?` });
	}

	set_transcript(transcript, timeout_ms) {
		this.setState({ transcript: { text: transcript, timeout_ms: timeout_ms } });
		setTimeout(this.setState.bind(this, { transcript: null }), timeout_ms);
	}

	handle_speech(event) {
		const raw_transcript = event.results[0][0].transcript.toLowerCase();

		if (raw_transcript === "skip") {
			this.speak({ text: "Okay" }, this.set_challenge.bind(this));
			return;
		}

		// Sometimes the speech recognition is spotty for short utterances, so let people say
		// "it's a t" or "it's an r" or "it's d" or "that's an x", as well.
		const extracted_value = (/^(?:tha|i)t'?s(?: an?)? (.+)$/.exec(raw_transcript) || {})[1];
		const transcript = extracted_value || raw_transcript;
		if (!this.state.challenge.voice_aliases.includes(transcript)) {
			this.speak({ text: "Sorry, that's not it", pitch: 0.8 });
			this.set_transcript(transcript, 3000);
			return;
		}

		const example = this.state.challenge.examples ? ` for ${random_choice(this.state.challenge.examples)}` : "";
		const congratulations = [ "great", "well done", "good job", "way to go", "perfect", "that's right" ];
		this.speak(
			{ text: `${random_choice(congratulations)}! It's ${this.state.challenge.value}${example}`, pitch: 1.1 },
			setTimeout.bind(null, this.set_challenge.bind(this), 1000)
		);

		this.setState({ victory: true });
	}

	listen_for_input() {
		const recognition = new webkitSpeechRecognition();
		window.recognition = recognition; // TODO: does this work? Trying to deal with the recognition cutting out intermittently
		recognition.continuous = true;
		recognition.onresult = this.handle_speech.bind(this);
		recognition.onstart = () => { this.setState({ listening: true }); };
		recognition.onend = () => { this.setState({ listening: false }); };
		recognition.onerror = () => { this.setState({ listening: false }); };
		recognition.start();
		this.setState({ speech_recognition_instance: recognition });
	}

	handle_visibility_change(event) {
		if (event.type === "blur" || document.visibilityState === "hidden") {
			this.setState({ page_hidden: true });
			this.pause_listening();
		} else if (event.type === "focus" || document.visibilityState === "visible") {
			this.setState({ page_hidden: false });
			this.resume_listening();
		}
	}

	componentWillMount() {
		document.addEventListener("visibilitychange", this.handle_visibility_change.bind(this));
		window.addEventListener("blur", this.handle_visibility_change.bind(this));
		window.addEventListener("focus", this.handle_visibility_change.bind(this));

		window.fetch("./challenges.json")
			.then((response) => response.json())
			.then(
				(data) => {
					this.setState({ challenge_pool: data });
					this.listen_for_input();
					this.set_challenge();
				}
			);
	}

	render() {
		return React.createElement(
			"div", null,
			this.state.challenge ? React.createElement(ChallengeDisplay, { value: this.state.challenge.value, victory: this.state.victory }) : null,
			this.state.listening ? React.createElement(ListeningIndicator) : null,
			this.state.transcript ? React.createElement(Transcript, { transcript: this.state.transcript }) : null,
			this.state.victory ? React.createElement(Fireworks) : null
		);
	}
}

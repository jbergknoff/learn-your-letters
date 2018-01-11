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

		return React.createElement("div", { style: styles }, this.props.transcript.text);
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

		// These are internal state that don't directly affect the UI.
		this.debug = true;
		this.speech_recognition_instance = null;
		this.challenge_pool = [];
		this.waiting_for_input = false; // True if we're waiting for a challenge response
		this.page_focused = true;

		// These are elements of state which directly affect the UI.
		this.state = {
			challenge: null, // The challenge currently being displayed
			listening: false, // True if microphone is on
			transcript: null, // Populated when showing a speech recognition transcript
			victory: false // True while showing victory animation
		};
	}

	pause_listening() {
		if (!this.speech_recognition_instance) {
			return;
		}

		this.speech_recognition_instance.abort();
	}

	resume_listening() {
		if (!this.speech_recognition_instance || !this.page_focused || this.state.listening) {
			return;
		}

		try {
			this.speech_recognition_instance.start();
		} catch (e) {
			if (this.debug) {
				console.log("Failed to start listening:", e);
			}
		}
	}

	// options: object with
	//		text: string
	//		pitch: optional number between 0 and 2.
	//		prompt: optional boolean (default false), whether to listen for a response after speaking
	speak(options, callback) {
		const utterance = new SpeechSynthesisUtterance(options.text);
		// Workaround for Chrome garbage collection causing "end" event to fail to fire.
		// https://bugs.chromium.org/p/chromium/issues/detail?id=509488#c11
		window.utterance = utterance;

		if (typeof options.pitch !== "undefined") {
			utterance.pitch = options.pitch;
		}

		utterance.onend = () => {
			if (options.prompt) {
				this.waiting_for_input = true;
				this.resume_listening();
			}

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
			challenge = random_choice(this.challenge_pool);
			if (challenge.value !== existing_challenge_value) {
				break;
			}
		}

		const type = /^[A-Z]$/.test(challenge.value) ? "letter" : "number";
		this.setState({ challenge: challenge, victory: false });
		this.speak({ text: `What ${type} is this?`, prompt: true });
	}

	set_transcript(transcript, timeout_ms) {
		this.setState({ transcript: { text: transcript, timeout_ms: timeout_ms } });
		setTimeout(this.setState.bind(this, { transcript: null }), timeout_ms);
	}

	handle_speech(event) {
		this.waiting_for_input = false;
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
			this.speak({ text: "Sorry, that's not it", pitch: 0.8, prompt: true });
			this.set_transcript(`Heard: ${transcript}`, 3000);
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

	setup_speech_recognition() {
		const recognition = new webkitSpeechRecognition();
		recognition.addEventListener("result", this.handle_speech.bind(this));
		recognition.addEventListener("start", () => { this.setState({ listening: true }); });
		recognition.addEventListener("error", () => { this.setState({ listening: false }); });

		recognition.addEventListener(
			"end",
			() => {
				this.setState({ listening: false });

				// Chrome sometimes fires an "end" event without an "error" or "result",
				// for example it often happens when I say "d". Track whether we're waiting
				// for a result, and reprompt if we end prematurely.
				// https://bugs.chromium.org/p/chromium/issues/detail?id=428873
				if (this.waiting_for_input && this.page_focused) {
					this.set_transcript("Error talking to speech API", 3000);
					this.speak({ text: "Sorry, say that again?", prompt: true });
				}
			}
		);

		if (this.debug) {
			recognition.addEventListener("start", console.log.bind(console, "recognition start"));
			recognition.addEventListener("end", console.log.bind(console, "recognition end"));
			recognition.addEventListener("error", console.log.bind(console, "recognition error: "));
			recognition.addEventListener("result", console.log.bind(console, "recognition result: "));
		}

		this.speech_recognition_instance = recognition;
	}

	handle_visibility_change(event) {
		if (event.type === "blur" || document.visibilityState === "hidden") {
			this.page_focused = false;
			this.pause_listening();
		} else if (event.type === "focus" || document.visibilityState === "visible") {
			this.page_focused = true;
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
					this.challenge_pool = data;
					this.setup_speech_recognition();
					this.set_challenge();
				}
			);
	}

	render() {
		return React.createElement(
			"div", null,
			this.state.challenge ? React.createElement(ChallengeDisplay, { value: this.state.challenge.value }) : null,
			this.state.listening ? React.createElement(ListeningIndicator) : null,
			this.state.transcript ? React.createElement(Transcript, { transcript: this.state.transcript }) : null,
			this.state.victory ? React.createElement(Fireworks) : null
		);
	}
}

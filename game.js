"use strict";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const numbers = "0123456789".split("");

const challenges = [
	{
		value: "A",
		examples: [ "apple", "alligator" ]
	},
	{
		value: "B",
		examples: [ "ball", "balloon" ]
	},
	{
		value: "C",
		examples: [ "cookie", "cat" ]
	},
	{ value: "3" }

];

const random_choice = (list) => {
	return list[~~(Math.random() * list.length)];
};

const CooldownProgressBar = (props) => {
	const styles = {
		position: "fixed",
		top: "1em",
		left: "1em",
		height: "1em",
		backgroundColor: "black",
		animation: `cooldown ${props.timeout_ms}ms linear`
	};

	return React.createElement("div", { style: styles });
};

const BigLetter = (props) => {
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
		fontFamily: "sans-serif"
	};

	return React.createElement("div", { style: styles }, props.value);
};

class Game extends React.Component {
	constructor() {
		super()
		this.state = {
			challenge: null,
			cooldown: false
		};
	}

	cool_down(timeout_ms) {
		if (this.state.cooldown) {
			return;
		}

		this.setState({ cooldown: timeout_ms });
		setTimeout(this.setState.bind(this, { cooldown: false }), timeout_ms);
	}

	set_challenge() {
		const new_challenge = random_choice(challenges);
		const type = letters.includes(new_challenge.value) ? "letter" : "number";
		this.setState({ challenge: new_challenge });
		speechSynthesis.speak(new SpeechSynthesisUtterance(`What ${type} is this?`))
	}

	handle_key_press(event) {
		// Don't respond if any modifier keys were held down.
		if (event.ctrlKey || event.shiftKey || event.metaKey) {
			return;
		}

		if (this.state.cooldown) {
			return;
		}

		if (event.key.toUpperCase() !== this.state.challenge.value.toUpperCase()) {
			const sorry_utterance = new SpeechSynthesisUtterance(`Sorry, it's not ${event.key}`);
			sorry_utterance.pitch = 0.8;
			speechSynthesis.speak(sorry_utterance);
			this.cool_down(1000);
			return;
		}

		const example = this.state.challenge.examples ? ` like ${random_choice(this.state.challenge.examples)}` : "";
		const congratulatory_utterance = new SpeechSynthesisUtterance(`Great! It's ${this.state.challenge.value}${example}`);
		congratulatory_utterance.pitch = 1.2;
		congratulatory_utterance.onend = setTimeout.bind(null, this.set_challenge.bind(this), 300);
		speechSynthesis.speak(congratulatory_utterance);
	}

	componentWillMount() {
		document.addEventListener("keypress", this.handle_key_press.bind(this)); // TODO voice entry should push the game loop along, not key press
		this.set_challenge();
	}

	render() {
		return React.createElement(
			"div", null,
			React.createElement(BigLetter, { value: this.state.challenge.value }),
			this.state.cooldown ? React.createElement(CooldownProgressBar, { timeout_ms: this.state.cooldown }) : null
		);
	}
}

"use strict";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const get_random_letter = () => {
	return letters[~~(Math.random() * letters.length)];
};

const CooldownProgressBar = (props) => {
	return React.createElement(
		"div",
		{
			style: {
				position: "fixed",
				top: "1em",
				left: "1em",
				height: "1em",
				backgroundColor: "black",
				animation: `cooldown ${props.timeout_ms}ms linear`
			}
		}
	);
};

const BigLetter = (props) => {
	return React.createElement(
		"div",
		{
			style: {
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
			}
		},
		props.letter
	);
};

class Game extends React.Component {
	constructor() {
		super()
		this.state = {
			letter: get_random_letter(),
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

	handle_key_press(event) {
		console.log(event);
		// Don't respond if any modifier keys were held down.
		if (event.ctrlKey || event.shiftKey || event.metaKey) {
			return;
		}

		if (this.state.cooldown) {
			return;
		}

		if (event.key.toUpperCase() !== this.state.letter.toUpperCase()) {
			speechSynthesis.speak(new SpeechSynthesisUtterance("Nope"));
			this.cool_down(1000);
			return;
		}

		speechSynthesis.speak(new SpeechSynthesisUtterance("Great!"));
		setTimeout(this.setState.bind(this, { letter: get_random_letter() }), 500);
	}

	componentWillMount() {
		document.addEventListener("keypress", this.handle_key_press.bind(this)); // TODO voice entry should push the game loop along, not key press
	}

	render() {
		return React.createElement(
			"div", null,
			React.createElement(BigLetter, { letter: this.state.letter }),
			this.state.cooldown ? React.createElement(CooldownProgressBar, { timeout_ms: this.state.cooldown }) : null
		);
	}
}

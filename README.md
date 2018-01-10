# Learn Your Letters

This is a game that I'm making so my toddler can get practice naming letters. It uses the Web APIs for `SpeechRecognition` and `SpeechSynthesis` which, at the moment, are only well supported in Chrome.

## Development

Refer to development_server.py to generate a self-signed TLS certificate. Then run `python development_server.py` and navigate to https://localhost:4443 in a browser.

`SpeechRecognition` is only enabled on TLS-enabled pages.

## Deployment

Push to the `master` branch of this repository, which is published to https://jbergknoff.github.io/learn-your-letters

# Learn Your Letters

This is a game that I'm making so my toddler can get practice naming letters. It uses the Web APIs for `SpeechRecognition` and `SpeechSynthesis` which, at the moment, are only well supported in Chrome.

Play online at https://jbergknoff.github.io/learn-your-letters.

## Web Speech APIs

The Chrome speech synthesis and recognition APIs both use remote APIs, so they do not work offline. The traffic doesn't show up in the network tab of the developer console, but you can see it in chrome://net-internals. There's some more details available [here](https://stackoverflow.com/a/41550344/349427) and [here](http://blog.travispayton.com/wp-content/uploads/2014/03/Google-Speech-API.pdf).

## Development

Refer to development_server.py to generate a self-signed TLS certificate. Then run `python development_server.py` and navigate to https://localhost:4443 in a browser.

`SpeechRecognition` is only enabled on TLS-enabled pages.

## Deployment

Push to the `master` branch of this repository, which is published to https://jbergknoff.github.io/learn-your-letters

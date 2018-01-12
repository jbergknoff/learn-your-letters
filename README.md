# Learn Your Letters

This is a game that I'm making to help my toddler learn his letters. It uses the Web APIs for `SpeechRecognition` and `SpeechSynthesis` which, at the moment, are only well supported in Chrome (including Chrome on Android).

Play online at https://jbergknoff.github.io/learn-your-letters.

This was partially inspired by an [old DOS game](https://www.myabandonware.com/game/early-games-for-young-children-3tt) which we sometimes play in DOSBox. That one doesn't really teach letters, though, just where they are on the keyboard. One nice feature of playing games in fullscreen in DOSBox is that it's hard for a toddler to accidentally close the game or switch windows. Having a purely voice-based interface is also good in that respect.

## Web Speech APIs

The Chrome speech synthesis and recognition APIs both use remote services, so they do not work offline. The traffic doesn't show up in the network tab of the developer console, but you can see it in chrome://net-internals. There's some more details available [here](https://stackoverflow.com/a/41550344/349427) and [here](http://blog.travispayton.com/wp-content/uploads/2014/03/Google-Speech-API.pdf).

Speech recognition often fails, especially when listening to a child's voice. There seems to be a [bug](https://bugs.chromium.org/p/chromium/issues/detail?id=428873) in Chrome's speech recognition browser API where certain utterances get back neither errors nor results from the remote speech API. This often happens when I say "d" or "m". A workaround is to say something longer, like "that's a d" or "it's an m", which have rudimentary support in the game.

Still, it's amazing to have access to such powerful features with so little effort. It took like an hour to get this game into a basic working state.

## Development

`SpeechRecognition` is only enabled on TLS-enabled pages.

Generate a self-signed TLS certificate with

```sh
$ openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes
```

Then run `python development_server.py` and navigate to https://localhost:4443 in a browser.

## Deployment

Push to the `master` branch of this repository, which is published to https://jbergknoff.github.io/learn-your-letters

## Credits

The sweet CSS fireworks are from http://jsfiddle.net/elin/7m3bL/.

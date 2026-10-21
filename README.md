# ![Sabaki Remote: An elegant Go/Baduk/Weiqi board and SGF editor for a more civilized age.](./banner.png)

**Sabaki Remote** is a fork of [Sabaki](https://github.com/SabakiHQ/Sabaki) that
can run GTP engines on a remote server over SSH. The UI stays local; the model
runs where the GPU is.

## Remote engines over SSH

Sabaki Remote does not open any network port. When an engine is configured with
the `ssh` transport, the app spawns a local `ssh` process and speaks GTP over
its stdin/stdout, so the connection is encrypted and authenticated by SSH
itself. Only public-key authentication is used — passwords are never collected
or stored.

To configure one, open **Preferences → Engines**, set **Transport** to **SSH
remote**, and fill in:

| Field           | Example                          | Notes                                                                 |
| --------------- | -------------------------------- | --------------------------------------------------------------------- |
| Host            | `gpu.example.com`                | `user@host` is also accepted                                          |
| User            | `alice`                          | Optional; defaults to your SSH config                                 |
| Port            | `22`                             | Optional                                                              |
| Identity file   | `C:\Users\alice\.ssh\id_ed25519` | Optional; leave empty to use ssh-agent / `~/.ssh/config`              |
| Verify host key | checked                          | Highly recommended. Unchecked uses `StrictHostKeyChecking=accept-new` |
| Engine path     | `/opt/katago/katago`             | Path **on the remote server**                                         |
| Arguments       | `gtp -model … -config …`         | Passed to the remote engine                                           |

The remote command is executed with the SSH user's default login shell. Make
sure the host key is already in `known_hosts` (or connect once from a terminal
first) and that `ssh-agent` holds the key if it is passphrase-protected.

## Features

- Fuzzy stone placement
- Read and save SGF games and collections, open wBaduk NGF and Tygem GIB files
- Display formatted SGF comments using a
  [subset of Markdown](https://github.com/SabakiHQ/Sabaki/blob/master/docs/guides/markdown.md)
  and annotate board positions & moves
- Personalize board appearance with
  [textures & themes](https://github.com/SabakiHQ/Sabaki/blob/master/docs/guides/theme-directory.md)
- SGF editing tools, including lines & arrows board markup
- Copy & paste variations
- Powerful undo/redo
- Fast game tree
- Score estimator & scoring tool
- Find move by move position and comment text
- [GTP engines](https://github.com/SabakiHQ/Sabaki/blob/master/docs/guides/engines.md)
  support with
  [board analysis for supported engines](https://github.com/SabakiHQ/Sabaki/blob/master/docs/guides/engine-analysis-integration.md)
- Guess mode
- Autoplay games

![Screenshot](screenshot.png)

## Documentation

For more information visit the
[documentation](https://github.com/SabakiHQ/Sabaki/blob/master/docs/README.md).
You're welcome to
[contribute](https://github.com/SabakiHQ/Sabaki/blob/master/CONTRIBUTING.md) to
this project.

## Building & Tests

See
[Building & Tests](https://github.com/SabakiHQ/Sabaki/blob/master/docs/guides/building-tests.md)
in the documentation.

## License

This project is licensed under the
[MIT license](https://github.com/SabakiHQ/Sabaki/blob/master/LICENSE.md).

## Donators

A big thank you to these lovely people:

- Eric Wainwright
- Michael Noll
- John Hager
- Azim Palmer
- Nicolas Puyaubreau
- Hans Christian Poerschke
- David Göbel
- Dominik Olszewski
- Brian Weaver
- Philippe Fanaro
- James Tudor
- Frank Orben
- Dekun Song
- Dimitri Rusin
- Andrew Thieman
- Adrian Petrescu
- Karlheinz Agsteiner
- Petr Růžička
- Sergio Villegas
- Jake Pivnik

## Related

- [Shudan](https://github.com/SabakiHQ/Shudan) - A highly customizable,
  low-level Preact Goban component.
- [boardmatcher](https://github.com/SabakiHQ/boardmatcher) - Finds patterns &
  shapes in Go board arrangements and names moves.
- [deadstones](https://github.com/SabakiHQ/deadstones) - Simple Monte Carlo
  functions to determine dead stones.
- [go-board](https://github.com/SabakiHQ/go-board) - A Go board data type.
- [gtp](https://github.com/SabakiHQ/gtp) - A Node.js module for handling GTP
  engines.
- [immutable-gametree](https://github.com/SabakiHQ/immutable-gametree) - An
  immutable game tree data type.
- [influence](https://github.com/SabakiHQ/influence) - Simple heuristics for
  estimating influence maps on Go positions.
- [sgf](https://github.com/SabakiHQ/sgf) - A library for parsing and creating
  SGF files.

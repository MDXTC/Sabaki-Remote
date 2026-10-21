# Engines

You can add Go engines to Sabaki to play offline against an AI opponent. Sabaki
then acts as a graphical UI for any Go software that supports
[GTP (Go Text Protocol)](https://www.lysator.liu.se/~gunnar/gtp/).

Most of the Go engines support optional parameters to tune their capacities.
List of this parameters can be found in engine documentation.

- [**Leela Zero**](http://zero.sjeng.org/): Download the latest appropriate
  version for you system (binary and source code available). Then get a network
  hash file, likely the [best network](http://zero.sjeng.org/best-network) is
  the one you want. This engine supports analysis as well.

  Arguments: `--gtp -w path/to/weightsfile`

- [**KataGo**](https://github.com/lightvector/KataGo): Download the latest
  appropriate version from releases page for you system with pretrained models.
  This engine supports analysis as well.

  Arguments: `gtp -model /path/to/model.txt.gz -config /path/to/gtp_example.cfg`

- [**GNU Go**](http://www.gnu.org/software/gnugo): There are binaries available
  for Windows. On Linux and macOS you can compile the engine from source. There
  are also
  [binaries for OS X 10.4.3 and above (universal binary) here](http://www.sente.ch/pub/software/goban/gnugo-3.7.11.dmg).

  Arguments: `--mode gtp`

- [**Pachi**](https://github.com/pasky/pachi): There are binaries available for
  Windows and Linux. The source code is available to compile the engine.

  Arguments: None

- [**Leela**](https://www.sjeng.org/leela.html): Download the _engine only
  (commandline/GTP engine)_ version.

  Arguments: `--gtp`

- [**AQ**](https://github.com/ymgaq/AQ): AQ is an open-source Go engine with
  level of expert players.

  Arguments: None

- [**Ray**](https://github.com/zakki/Ray): Ray is an open-source Go engine with
  level of expert players.

  Arguments: None

## Remote engines over SSH

Sabaki Remote can run an engine on another machine and use it as if it were
local. GTP commands are written to the stdin of a local `ssh` process and the
engine's responses are read from its stdout, so no port is opened and no
engine-specific server is needed.

1. Open **Preferences → Engines** and add an engine.
2. Set **Transport** to **Remote server over SSH**.
3. Enter the host (and optionally user, port, and identity file).
4. Set **Engine path** to the engine binary on the remote machine, and
   **Arguments** to the arguments you would pass to it there.

```
Host:          gpu.example.com
User:          alice
Port:          22
Identity file: (empty — use ssh-agent or ~/.ssh/config)
Engine path:   /opt/katago/katago
Arguments:     gtp -model /models/kata1.bin.gz -config /etc/katago/gtp.cfg
```

Security notes:

- Only public-key authentication is used. `BatchMode=yes`,
  `PreferredAuthentications=publickey`, and `PasswordAuthentication=no` are
  enforced, so Sabaki never sees or stores a password.
- Host keys are verified against `known_hosts` by default. Disable **Verify host
  key** only if you understand the risk; it switches ssh to
  `StrictHostKeyChecking=accept-new`.
- Agent and X11 forwarding are disabled, and `PermitLocalCommand` is off, so a
  compromised shared server cannot use the connection to reach your machine.
- The identity file is pinned with `IdentitiesOnly=yes` when specified.
- On a shared server, keep the engine within **16 threads** and **50 GB of
  memory**, and tune its config accordingly so your session does not starve
  other users.

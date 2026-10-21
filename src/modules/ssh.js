import {homedir} from 'os'

export const LOCAL_TRANSPORT = 'local'
export const SSH_TRANSPORT = 'ssh'

// Everything the user can type that ends up in an ssh argv slot is validated
// here. Host, user and port become separate arguments, so a leading dash would
// be parsed by ssh as an option; the regular expressions below rule that out.
const hostRegexp = /^[A-Za-z0-9._-]+$/
const ipv6Regexp = /^\[[0-9A-Fa-f:.]+\]$/
const userRegexp = /^[A-Za-z0-9._-]+$/
const bareRemotePathRegexp = /^[A-Za-z0-9_./~+-]+$/

export class SshConfigError extends Error {
  constructor(errors) {
    super(errors.join(' '))
    this.name = 'SshConfigError'
    this.errors = errors
  }
}

export function isSshEngine(engine = {}) {
  return engine.transport === SSH_TRANSPORT
}

export function normalizeSsh(engine = {}) {
  let ssh = engine.ssh || {}
  let host = String(ssh.host == null ? '' : ssh.host).trim()
  let user = String(ssh.user == null ? '' : ssh.user).trim()

  // Accept "user@host" in the host field as a convenience.
  let at = host.lastIndexOf('@')
  if (at > 0) {
    if (user === '') user = host.slice(0, at)
    host = host.slice(at + 1)
  }

  let port = null
  if (ssh.port != null && String(ssh.port).trim() !== '') {
    port = Number(String(ssh.port).trim())
  }

  return {
    host,
    user,
    port,
    identityFile: String(
      ssh.identityFile == null ? '' : ssh.identityFile,
    ).trim(),
    strictHostKeyChecking: ssh.strictHostKeyChecking !== false,
  }
}

export function validateSshEngine(engine = {}) {
  if (!isSshEngine(engine)) return []

  let errors = []
  let {host, user, port, identityFile} = normalizeSsh(engine)
  let remotePath = String(engine.path == null ? '' : engine.path).trim()
  let remoteArgs = String(engine.args == null ? '' : engine.args)

  if (host === '') {
    errors.push('Remote host is required.')
  } else if (!hostRegexp.test(host) && !ipv6Regexp.test(host)) {
    errors.push(
      'Remote host may only contain letters, digits, dots, dashes and underscores.',
    )
  }

  if (user !== '' && !userRegexp.test(user)) {
    errors.push(
      'SSH user may only contain letters, digits, dots, dashes and underscores.',
    )
  }

  if (port != null && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    errors.push('SSH port must be an integer between 1 and 65535.')
  }

  if (/[\0\r\n]/.test(identityFile)) {
    errors.push('Identity file path contains invalid characters.')
  }

  if (remotePath === '') {
    errors.push('Remote engine path is required.')
  } else if (/[\0\r\n]/.test(remotePath)) {
    errors.push('Remote engine path contains invalid characters.')
  }

  if (/[\0\r\n]/.test(remoteArgs)) {
    errors.push('Engine arguments contain invalid characters.')
  }

  return errors
}

// Quote a remote path for the remote shell, but leave simple paths untouched
// so that "~" is still expanded by the shell.
function quoteRemotePath(path) {
  if (bareRemotePathRegexp.test(path)) return path
  return `'${path.replace(/'/g, `'\\''`)}'`
}

export function buildSshCommand(
  engine,
  {sshPath = 'ssh', cwd = homedir()} = {},
) {
  let errors = validateSshEngine(engine)
  if (errors.length > 0) throw new SshConfigError(errors)

  let {host, user, port, identityFile, strictHostKeyChecking} =
    normalizeSsh(engine)
  let remotePath = String(engine.path).trim()
  let remoteArgs = String(engine.args == null ? '' : engine.args).trim()

  // -T: no pseudo-terminal, so nothing but GTP travels over stdout.
  let args = ['-T']

  let options = [
    // Never prompt. Password prompts would hang the engine, and passwords must
    // not be handled by the app at all.
    'BatchMode=yes',
    'PreferredAuthentications=publickey',
    'PasswordAuthentication=no',
    'KbdInteractiveAuthentication=no',
    'ForwardAgent=no',
    'ForwardX11=no',
    'PermitLocalCommand=no',
    'ConnectTimeout=10',
    // Detect dead connections instead of leaving the engine silently wedged.
    'ServerAliveInterval=15',
    'ServerAliveCountMax=3',
    // GTP traffic is tiny and latency-sensitive.
    'Compression=no',
    `StrictHostKeyChecking=${strictHostKeyChecking ? 'yes' : 'accept-new'}`,
  ]

  for (let option of options) args.push('-o', option)

  if (port != null) args.push('-p', String(port))
  if (identityFile !== '') {
    args.push('-i', identityFile, '-o', 'IdentitiesOnly=yes')
  }
  if (user !== '') args.push('-l', user)

  let remoteCommand = quoteRemotePath(remotePath)
  if (remoteArgs !== '') remoteCommand += ` ${remoteArgs}`

  args.push(host, remoteCommand)

  return {path: sshPath, args, cwd, transport: SSH_TRANSPORT}
}

import assert from 'assert'

import {
  LOCAL_TRANSPORT,
  SSH_TRANSPORT,
  SshConfigError,
  buildSshCommand,
  normalizeSsh,
  validateSshEngine,
} from '../../src/modules/ssh.js'

function sshEngine(overrides = {}) {
  return {
    name: 'KataGo',
    transport: SSH_TRANSPORT,
    path: '/opt/katago/katago',
    args: 'gtp -model /models/kata.bin.gz',
    commands: '',
    ssh: {
      host: 'gpu.example.com',
      user: 'alice',
      port: 22,
      identityFile: '',
      strictHostKeyChecking: true,
    },
    ...overrides,
  }
}

function optionValue(args, option) {
  let index = args.indexOf(option)
  return index < 0 ? null : args[index + 1]
}

describe('SSH engine transport', () => {
  it('leaves local engines untouched', () => {
    let engine = {transport: LOCAL_TRANSPORT, path: '/usr/bin/gnugo'}
    assert.deepStrictEqual(validateSshEngine(engine), [])
  })

  it('builds a hardened ssh invocation', () => {
    let {path, args, transport, cwd} = buildSshCommand(sshEngine(), {
      cwd: '/tmp',
    })

    assert.strictEqual(path, 'ssh')
    assert.strictEqual(transport, SSH_TRANSPORT)
    assert.strictEqual(cwd, '/tmp')

    // No pseudo-terminal: only GTP may travel over stdout.
    assert(args.includes('-T'))

    assert.strictEqual(optionValue(args, '-o'), 'BatchMode=yes')
    assert(
      args.includes('PreferredAuthentications=publickey'),
      'must only authenticate with public keys',
    )
    assert(args.includes('PasswordAuthentication=no'))
    assert(args.includes('KbdInteractiveAuthentication=no'))
    assert(args.includes('ForwardAgent=no'))
    assert(args.includes('PermitLocalCommand=no'))
    assert(args.includes('Compression=no'))
    assert(args.includes('StrictHostKeyChecking=yes'))

    assert.strictEqual(optionValue(args, '-l'), 'alice')
    assert.strictEqual(optionValue(args, '-p'), '22')

    // Destination and remote command are the final two arguments.
    assert.strictEqual(args[args.length - 2], 'gpu.example.com')
    assert.strictEqual(
      args[args.length - 1],
      '/opt/katago/katago gtp -model /models/kata.bin.gz',
    )
  })

  it('accepts user@host in the host field', () => {
    let normalized = normalizeSsh({
      ssh: {host: 'bob@gpu.example.com', user: ''},
    })
    assert.strictEqual(normalized.user, 'bob')
    assert.strictEqual(normalized.host, 'gpu.example.com')
  })

  it('rejects option injection in host and user', () => {
    for (let engine of [
      sshEngine({ssh: {host: '-oProxyCommand=evil'}}),
      sshEngine({ssh: {host: 'gpu.example.com', user: '-oProxyCommand=evil'}}),
      sshEngine({ssh: {host: 'gpu example.com'}}),
      sshEngine({ssh: {host: 'gpu.example.com', user: 'al ice'}}),
    ]) {
      assert(validateSshEngine(engine).length > 0)
      assert.throws(() => buildSshCommand(engine), SshConfigError)
    }
  })

  it('requires a host and a remote path', () => {
    assert.throws(
      () => buildSshCommand(sshEngine({ssh: {host: ''}})),
      SshConfigError,
    )
    assert.throws(() => buildSshCommand(sshEngine({path: ''})), SshConfigError)
  })

  it('validates the port', () => {
    for (let port of [0, 65536, 1.5, 'abc']) {
      assert(
        validateSshEngine(sshEngine({ssh: {host: 'h', port}})).length > 0,
        `port ${port} should be rejected`,
      )
    }
    assert.deepStrictEqual(
      validateSshEngine(sshEngine({ssh: {host: 'h', port: '2222'}})),
      [],
    )
  })

  it('quotes remote paths that need it, leaving simple paths for ~ expansion', () => {
    let command = (path) => {
      let {args} = buildSshCommand(sshEngine({path, args: ''}), {cwd: '/tmp'})
      return args[args.length - 1]
    }

    assert.strictEqual(command('~/katago'), '~/katago')
    assert.strictEqual(
      command('/opt/my katago/katago'),
      "'/opt/my katago/katago'",
    )
    assert.strictEqual(command("/opt/it's/katago"), "'/opt/it'\\''s/katago'")
  })

  it('falls back to accept-new only when host key verification is disabled', () => {
    let args = buildSshCommand(
      sshEngine({ssh: {host: 'h', strictHostKeyChecking: false}}),
      {cwd: '/tmp'},
    ).args

    assert(args.includes('StrictHostKeyChecking=accept-new'))
    assert(!args.includes('StrictHostKeyChecking=yes'))
  })

  it('passes the identity file and pins ssh to it', () => {
    let args = buildSshCommand(
      sshEngine({
        ssh: {host: 'h', identityFile: 'C:\\Users\\alice\\.ssh\\id_ed25519'},
      }),
      {cwd: '/tmp'},
    ).args

    assert.strictEqual(
      optionValue(args, '-i'),
      'C:\\Users\\alice\\.ssh\\id_ed25519',
    )
    assert(args.includes('IdentitiesOnly=yes'))
  })
})

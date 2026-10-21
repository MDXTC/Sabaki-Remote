const {expect} = require('@playwright/test')
const {test} = require('./fixtures/electron-app')

// Covers the Preferences → Engines form for the SSH transport: the remote-only
// fields appear, validation runs, and the full engine object (including the
// nested `ssh` block) is persisted to settings.

test.describe('SSH engine settings', () => {
  test('configures and persists a remote engine', async ({page}) => {
    await page.evaluate(() => {
      window.__sabaki.setState({preferencesTab: 'engines'})
      window.__sabaki.openDrawer('preferences')
    })

    await page
      .locator('#preferences')
      .getByRole('button', {name: 'Add'})
      .click()

    const item = page.locator('#preferences .engines-list li').first()
    await expect(item).toBeVisible()

    // New engines default to the local transport, so SSH fields stay hidden.
    await expect(item.locator('select[name="transport"]')).toHaveValue('local')
    await expect(item.locator('input[name="ssh.host"]')).toHaveCount(0)

    await item.locator('select[name="transport"]').selectOption('ssh')
    await expect(item.locator('input[name="ssh.host"]')).toBeVisible()

    // An incomplete configuration must be called out, not silently saved.
    await expect(item.locator('.ssh-error')).toContainText(
      'Remote host is required.',
    )

    await item.locator('input[name="name"]').fill('KataGo (GPU)')
    await item.locator('input[name="ssh.host"]').fill('gpu.example.com')
    await item.locator('input[name="ssh.user"]').fill('alice')
    await item.locator('input[name="ssh.port"]').fill('2222')
    await item
      .locator('input[name="ssh.identityFile"]')
      .fill('/home/alice/.ssh/id_ed25519')
    await item.locator('input[name="path"]').fill('/opt/katago/katago')
    await item
      .locator('input[name="args"]')
      .fill('gtp -model /models/kata.bin.gz')
    await item.locator('input[name="ssh.strictHostKeyChecking"]').uncheck()

    await page.waitForFunction(() => {
      let engines = window.sabaki.setting.get('engines.list')
      return engines.length === 1 && engines[0].ssh?.host === 'gpu.example.com'
    })

    const engine = await page.evaluate(
      () => window.sabaki.setting.get('engines.list')[0],
    )

    expect(engine).toMatchObject({
      name: 'KataGo (GPU)',
      transport: 'ssh',
      path: '/opt/katago/katago',
      args: 'gtp -model /models/kata.bin.gz',
      ssh: {
        host: 'gpu.example.com',
        user: 'alice',
        identityFile: '/home/alice/.ssh/id_ed25519',
        strictHostKeyChecking: false,
      },
    })
    expect(String(engine.ssh.port)).toBe('2222')

    await expect(item.locator('.ssh-error')).toHaveCount(0)
  })
})

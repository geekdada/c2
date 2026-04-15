import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const emptySnapshot = {
      path: '/mock/settings.json',
      exists: false,
      managedEnv: {},
      unmanagedKeys: [],
      hasModelOverride: false,
      backups: [],
      error: null,
    }

    window.__PROFILE_MANAGER_MOCK_API__ = {
      async bootstrap() {
        return {
          profiles: [],
          activeProfileId: null,
          settingsSnapshot: emptySnapshot,
          preferences: { theme: 'dark' },
        }
      },
      async getProfiles() {
        return []
      },
      async getActiveProfileId() {
        return null
      },
      async createProfile(input) {
        const now = new Date().toISOString()
        return {
          id: crypto.randomUUID(),
          name: input.name,
          env: input.env ?? {},
          createdAt: now,
          updatedAt: now,
        }
      },
      async updateProfile() {
        throw new Error('Not implemented in e2e mock')
      },
      async deleteProfile() {},
      async switchProfile() {
        throw new Error('Not implemented in e2e mock')
      },
      async readClaudeSettingsSnapshot() {
        return emptySnapshot
      },
      async restoreBackup() {},
      async getPreferences() {
        return { theme: 'dark' }
      },
      async savePreferences() {},
    }
  })
})

test('shows onboarding in browser preview with a mock desktop bridge', async ({
  page,
}) => {
  await page.goto('/#/')

  await expect(
    page.getByRole('heading', { name: 'Create your first C2 profile' })
  ).toBeVisible()
})

import { expect, test } from '@playwright/test'

import { createMockDesktopApi } from '@/testing/mockDesktopApi'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__PROFILE_MANAGER_MOCK_API__ = createMockDesktopApi()
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

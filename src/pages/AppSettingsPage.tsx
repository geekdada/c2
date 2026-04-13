import { Button, Card, CardContent, CardHeader, ToggleButton, ToggleButtonGroup } from '@heroui/react'
import type { Key } from '@heroui/react'
import { Monitor, MoonStar, RotateCcw, SunMedium } from 'lucide-react'

import { useProfilesStore } from '@/app/store/profiles'
import { useUiStore } from '@/app/store/ui'
import { managedEnvKeys, managedKeyLabels } from '@/shared/profiles'
import { isSecretKey, maskSecret } from '@/shared/schema'

export function AppSettingsPage() {
  const settingsSnapshot = useProfilesStore((state) => state.settingsSnapshot)
  const restoreBackup = useProfilesStore((state) => state.restoreBackup)
  const isSaving = useProfilesStore((state) => state.isSaving)
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const pushToast = useUiStore((state) => state.pushToast)

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--app-text)]">Settings</h1>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none">
          <CardHeader className="p-5">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">
              Claude settings file
            </h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {settingsSnapshot?.exists
                ? 'Current values read from disk.'
                : 'Settings file not created yet — activate a profile to create it.'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 pt-0">
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                Path
              </p>
              <p className="mt-2 break-all font-mono text-sm text-[var(--app-text)]">
                {settingsSnapshot?.path ?? 'Unavailable'}
              </p>
            </div>

            {settingsSnapshot?.error ? (
              <div className="rounded-2xl border border-rose-400/35 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
                {settingsSnapshot.error}
              </div>
            ) : null}

            <div className="grid gap-2 md:grid-cols-2">
              {managedEnvKeys.map((key) => {
                const value = settingsSnapshot?.managedEnv[key]
                const displayValue = value
                  ? isSecretKey(key)
                    ? maskSecret(value, key)
                    : value
                  : null

                return (
                  <div
                    key={key}
                    className={`rounded-xl border p-4 ${
                      displayValue
                        ? 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
                        : 'border-transparent bg-[var(--app-surface-muted)]/40'
                    }`}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                      {managedKeyLabels[key]}
                    </p>
                    <p
                      className={`mt-2 break-all text-sm ${
                        displayValue
                          ? 'font-mono text-[var(--app-text)]'
                          : 'text-[var(--app-text-subtle)]'
                      }`}
                    >
                      {displayValue ?? 'Not set'}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                Unmanaged environment variables
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {settingsSnapshot?.unmanagedKeys.length ? (
                  settingsSnapshot.unmanagedKeys.map((key) => (
                    <span
                      key={key}
                      className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 font-mono text-xs text-[var(--app-text-muted)]"
                    >
                      {key}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--app-text-muted)]">
                    No additional environment variables detected.
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-lg font-semibold text-[var(--app-text)]">
                Appearance
              </h2>
            </CardHeader>
            <CardContent className="p-5">
              <ToggleButtonGroup
                disallowEmptySelection
                selectedKeys={new Set([theme])}
                selectionMode="single"
                onSelectionChange={(keys: Set<Key>) => {
                  const value = [...keys][0] as 'light' | 'dark' | 'system'
                  setTheme(value)
                }}
              >
                <ToggleButton id="light">
                  <SunMedium className="h-4 w-4" />
                  Light
                </ToggleButton>
                <ToggleButton id="dark">
                  <MoonStar className="h-4 w-4" />
                  Dark
                </ToggleButton>
                <ToggleButton id="system">
                  <Monitor className="h-4 w-4" />
                  System
                </ToggleButton>
              </ToggleButtonGroup>
            </CardContent>
          </Card>

          <Card className="border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none">
            <CardHeader className="p-5 pb-0">
              <div>
                <h2 className="text-lg font-semibold text-[var(--app-text)]">
                  Backups
                </h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Your settings are backed up before every profile switch.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {settingsSnapshot?.backups.length ? (
                settingsSnapshot.backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
                  >
                    <p className="text-sm font-medium text-[var(--app-text)]">
                      {new Date(backup.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 break-all text-xs text-[var(--app-text-muted)]">
                      {backup.id}
                    </p>
                    <Button
                      className="mt-3"
                      isDisabled={isSaving}
                      variant="secondary"
                      onPress={() => {
                        void restoreBackup(backup.id).then(() => {
                          pushToast({
                            tone: 'success',
                            title: 'Backup restored',
                            description:
                              'Claude settings were replaced with the selected snapshot.',
                          })
                        })
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        <span>{isSaving ? 'Restoring…' : 'Restore'}</span>
                      </span>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-sm leading-6 text-[var(--app-text-muted)]">
                  No backups yet. Activate a profile to create the first
                  backup.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

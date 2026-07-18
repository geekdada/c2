import {
  Button,
  Card,
  CardContent,
  CardHeader,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import {
  BookOpen,
  CheckCircle,
  Download,
  Loader2,
  Monitor,
  MoonStar,
  RefreshCw,
  RotateCcw,
  SunMedium,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useProfilesStore } from "@/app/store/profiles";
import { useUiStore } from "@/app/store/ui";
import { useUpdaterStore } from "@/app/store/updater";
import { managedEnvKeys, managedKeyLabels, type ManagedEnvKey } from "@/shared/profiles";
import { isSecretKey, maskSecret } from "@/shared/schema";

function formatManagedEnvValue(key: ManagedEnvKey, value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  if (isSecretKey(key)) {
    return maskSecret(value, key);
  }

  if (key === "CLAUDE_CODE_ATTRIBUTION_HEADER") {
    return value === "0" ? "Disabled" : value;
  }

  if (
    key === "CLAUDE_CODE_ENABLE_AUTO_MODE" ||
    key === "CLAUDE_CODE_DISABLE_1M_CONTEXT" ||
    key === "CLAUDE_CODE_DISABLE_ATTACHMENTS"
  ) {
    return value === "1" ? "Enabled" : value;
  }

  return value;
}

export function AppSettingsPage() {
  const navigate = useNavigate();
  const settingsSnapshot = useProfilesStore((state) => state.settingsSnapshot);
  const restoreBackup = useProfilesStore((state) => state.restoreBackup);
  const isSaving = useProfilesStore((state) => state.isSaving);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const setShowOnboarding = useUiStore((state) => state.setShowOnboarding);
  const updateStatus = useUpdaterStore((state) => state.status);
  const checkForUpdate = useUpdaterStore((state) => state.checkForUpdate);
  const openReleasePage = useUpdaterStore((state) => state.openReleasePage);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-[var(--app-text)]">Settings</h1>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none">
          <CardHeader className="p-4">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">Claude settings file</h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {settingsSnapshot?.exists
                ? "Current values read from disk."
                : "Settings file not created yet — activate a profile to create it."}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 pt-0">
            <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                Path
              </p>
              <p className="mt-1.5 break-all font-mono text-sm text-[var(--app-text)]">
                {settingsSnapshot?.path ?? "Unavailable"}
              </p>
            </div>

            {settingsSnapshot?.error ? (
              <div className="rounded-lg border border-rose-400/35 bg-rose-400/10 p-3 text-sm leading-6 text-rose-100">
                {settingsSnapshot.error}
              </div>
            ) : null}

            <div className="grid gap-2 md:grid-cols-2">
              {managedEnvKeys.map((key) => {
                const displayValue = formatManagedEnvValue(key, settingsSnapshot?.managedEnv[key]);

                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-3 ${
                      displayValue
                        ? "border-[var(--app-border)] bg-[var(--app-surface-muted)]"
                        : "border-transparent bg-[var(--app-surface-muted)]/40"
                    }`}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                      {managedKeyLabels[key]}
                    </p>
                    <p
                      className={`mt-1.5 break-all text-sm ${
                        displayValue
                          ? "font-mono text-[var(--app-text)]"
                          : "text-[var(--app-text-subtle)]"
                      }`}
                    >
                      {displayValue ?? "Not set"}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                Unmanaged environment variables
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
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

        <div className="space-y-3">
          <Card className="border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none">
            <CardHeader className="p-4 pb-0">
              <h2 className="text-lg font-semibold text-[var(--app-text)]">Appearance</h2>
            </CardHeader>
            <CardContent className="p-4">
              <ToggleButtonGroup
                disallowEmptySelection
                selectedKeys={new Set([theme])}
                selectionMode="single"
                onSelectionChange={(keys: Set<Key>) => {
                  const value = [...keys][0] as "light" | "dark" | "system";
                  setTheme(value);
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
            <CardHeader className="p-4 pb-0">
              <div>
                <h2 className="text-lg font-semibold text-[var(--app-text)]">Backups</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Your settings are backed up before every profile switch.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {settingsSnapshot?.backups.length ? (
                settingsSnapshot.backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3"
                  >
                    <p className="text-sm font-medium text-[var(--app-text)]">
                      {new Date(backup.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 break-all text-xs text-[var(--app-text-muted)]">
                      {backup.id}
                    </p>
                    <Button
                      className="mt-2"
                      isDisabled={isSaving}
                      variant="secondary"
                      onPress={() => {
                        void restoreBackup(backup.id).then(() => {
                          toast.success("Backup restored", {
                            description:
                              "Claude settings were replaced with the selected snapshot.",
                            timeout: 3600,
                          });
                        });
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        <span>{isSaving ? "Restoring…" : "Restore"}</span>
                      </span>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm leading-6 text-[var(--app-text-muted)]">
                  No backups yet. Activate a profile to create the first backup.
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none">
            <CardHeader className="p-4 pb-0">
              <h2 className="text-lg font-semibold text-[var(--app-text)]">Updates</h2>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                  Version
                </p>
                <p className="mt-1.5 font-mono text-sm text-[var(--app-text)]">
                  v{__APP_VERSION__}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--app-text-muted)]">
                {updateStatus.state === "checking" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking for updates...</span>
                  </>
                )}
                {updateStatus.state === "available" && (
                  <>
                    <Download className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">v{updateStatus.version} available</span>
                  </>
                )}
                {updateStatus.state === "not-available" && (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>You're on the latest version</span>
                  </>
                )}
                {updateStatus.state === "error" && (
                  <span className="text-rose-400">{updateStatus.message}</span>
                )}
              </div>
              <div className="flex gap-2">
                {updateStatus.state === "available" ? (
                  <Button variant="primary" onPress={openReleasePage}>
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Download update</span>
                    </span>
                  </Button>
                ) : (
                  <Button
                    isDisabled={updateStatus.state === "checking"}
                    variant="secondary"
                    onPress={checkForUpdate}
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Check for updates</span>
                    </span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none">
            <CardHeader className="p-4 pb-0">
              <h2 className="text-lg font-semibold text-[var(--app-text)]">Onboarding</h2>
            </CardHeader>
            <CardContent className="p-4">
              <Button
                variant="secondary"
                onPress={() => {
                  setShowOnboarding(true);
                  navigate("/onboarding");
                }}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Show onboarding</span>
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

import { Button, Card, CardContent, CardFooter, CardHeader } from "@heroui/react";
import { ArrowRightLeft, Pencil, Trash2 } from "lucide-react";

import { sortProfiles } from "@/app/store/profiles";
import { advancedEnvKeys, managedEnvKeys, managedKeyLabels, type Profile } from "@/shared/profiles";
import { isSecretKey, maskSecret } from "@/shared/schema";

type ProfileListProps = {
  profiles: Profile[];
  activeProfileId: string | null;
  onActivate: (profileId: string) => void;
  onEdit: (profileId: string) => void;
  onDelete: (profileId: string) => void;
};

function formatManagedValue(profile: Profile, key: (typeof managedEnvKeys)[number]) {
  const value = profile.env[key];

  if (!value) {
    return null;
  }

  if (isSecretKey(key)) {
    return maskSecret(value, key);
  }

  return value;
}

export function ProfileList({
  profiles,
  activeProfileId,
  onActivate,
  onEdit,
  onDelete,
}: ProfileListProps) {
  if (profiles.length === 0) {
    return (
      <Card className="border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] shadow-none">
        <CardContent className="space-y-3 p-6">
          <h2 className="text-lg font-semibold text-[var(--app-text)]">No profiles yet</h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--app-text-muted)]">
            Create your first profile to manage Anthropic credentials and model aliases without
            editing Claude&apos;s settings file by hand.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {sortProfiles(profiles).map((profile) => {
        const isActive = profile.id === activeProfileId;

        return (
          <Card
            key={profile.id}
            className="border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none"
          >
            <CardHeader className="flex flex-wrap items-start justify-between gap-2 p-4 pb-2">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-[var(--app-text)]">{profile.name}</h3>
                  {isActive ? (
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/12 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-300">
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-xs text-[var(--app-text-subtle)]">
                  Updated {new Date(profile.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardHeader>

            <CardContent className="grid gap-2 px-4 pb-3 pt-0 sm:grid-cols-2">
              {managedEnvKeys.map((key) => {
                const value = formatManagedValue(profile, key);

                if (!value && advancedEnvKeys.includes(key)) {
                  return null;
                }

                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-2.5 ${
                      value
                        ? "border-[var(--app-border)] bg-[var(--app-surface-muted)]"
                        : "border-transparent bg-[var(--app-surface-muted)]/40"
                    }`}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                      {managedKeyLabels[key]}
                    </p>
                    <p
                      className={`mt-1.5 break-all text-sm ${
                        value
                          ? "font-mono text-[var(--app-text)]"
                          : "text-[var(--app-text-subtle)]"
                      }`}
                    >
                      {value ?? "Not set"}
                    </p>
                  </div>
                );
              })}
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
              {!isActive ? (
                <Button
                  variant="primary"
                  onPress={() => {
                    onActivate(profile.id);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Activate</span>
                  </span>
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onPress={() => {
                  onEdit(profile.id);
                }}
              >
                <span className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </span>
              </Button>
              <Button
                variant="danger-soft"
                onPress={() => {
                  onDelete(profile.id);
                }}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </span>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

import { Button, Card, CardContent } from "@heroui/react";
import { Plus, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useProfilesStore } from "@/app/store/profiles";
import { useUiStore } from "@/app/store/ui";
import { BrandBadge } from "@/components/layout/BrandBadge";

export function OnboardingPage() {
  const navigate = useNavigate();
  const profiles = useProfilesStore((state) => state.profiles);
  const settingsSnapshot = useProfilesStore((state) => state.settingsSnapshot);
  const setHasCompletedOnboarding = useUiStore((state) => state.setHasCompletedOnboarding);

  useEffect(() => {
    setHasCompletedOnboarding(false);
  }, [setHasCompletedOnboarding]);

  useEffect(() => {
    if (profiles.length > 0) {
      setHasCompletedOnboarding(true);
      navigate("/", { replace: true });
    }
  }, [navigate, profiles.length, setHasCompletedOnboarding]);

  return (
    <div className="mx-auto flex h-full max-w-5xl items-center justify-center px-6 py-12">
      <Card className="w-full border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_24px_60px_rgba(0,0,0,0.26)]">
        <CardContent className="space-y-8 p-8 md:p-10">
          <div className="space-y-4">
            <BrandBadge size="lg" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--app-text-subtle)]">
                Welcome to C2
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">
                Create your first C2 profile
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--app-text-muted)]">
                No reusable Anthropic credentials were found in `~/.claude/settings.json`, so C2
                starts empty. Create a profile to store the six managed env values and activate it
                whenever you want to rewrite Claude settings safely.
              </p>
            </div>
          </div>

          {settingsSnapshot?.error ? (
            <div className="rounded-2xl border border-amber-400/35 bg-amber-400/10 p-4 text-sm text-amber-100">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-1 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Claude settings need attention</p>
                  <p className="mt-1 leading-6">{settingsSnapshot.error}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Only six Anthropic keys are managed.",
              "Unmanaged Claude settings stay preserved.",
              "Switching deletes stale managed keys before writing new values.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-sm leading-6 text-[var(--app-text-muted)]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onPress={() => {
                navigate("/profiles/new");
              }}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Create first profile</span>
              </span>
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                navigate("/settings");
              }}
            >
              Review diagnostics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

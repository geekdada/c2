import { Button, Card, CardContent, Toast } from "@heroui/react";
import { useEffect } from "react";

import { BrandBadge } from "@/components/layout/BrandBadge";

import { AppRouter } from "./router";
import { useProfilesStore } from "./store/profiles";

function LoadingScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-[var(--app-bg)] px-4 py-8">
      <Card className="w-full max-w-lg border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <CardContent className="space-y-2 p-6">
          <BrandBadge size="lg" />
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--app-text-subtle)]">
            Bootstrapping
          </p>
          <h1 className="text-2xl font-semibold text-[var(--app-text)]">Loading C2</h1>
          <p className="text-sm leading-6 text-[var(--app-text-muted)]">
            Reading the local profile database, inspecting Claude settings, and preparing the secure
            desktop bridge for C2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FatalErrorScreen() {
  const error = useProfilesStore((state) => state.error);
  const bootstrap = useProfilesStore((state) => state.bootstrap);

  return (
    <div className="flex h-full items-center justify-center bg-[var(--app-bg)] px-4 py-8">
      <Card className="w-full max-w-xl border border-rose-400/35 bg-[var(--app-surface)] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <CardContent className="space-y-3 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-rose-300">
              Startup error
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold text-[var(--app-text)]">
              The app could not start cleanly
            </h1>
          </div>
          <p className="text-sm leading-6 text-[var(--app-text-muted)]">
            {error ?? "Unknown startup error."}
          </p>
          <Button
            variant="primary"
            onPress={() => {
              void bootstrap();
            }}
          >
            Retry bootstrap
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  const bootstrap = useProfilesStore((state) => state.bootstrap);
  const isLoading = useProfilesStore((state) => state.isLoading);
  const error = useProfilesStore((state) => state.error);
  const profiles = useProfilesStore((state) => state.profiles);
  const settingsSnapshot = useProfilesStore((state) => state.settingsSnapshot);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <div className="flex h-screen flex-col bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="titlebar" />
      <div className="min-h-0 flex-1">
        {isLoading ? (
          <LoadingScreen />
        ) : error && profiles.length === 0 && !settingsSnapshot ? (
          <FatalErrorScreen />
        ) : (
          <AppRouter />
        )}
        <Toast.Provider placement="top end" width={360} />
      </div>
    </div>
  );
}

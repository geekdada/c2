import { Button, Card, CardContent } from "@heroui/react";
import { Home, Plus, Settings } from "lucide-react";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useProfilesStore } from "@/app/store/profiles";
import { useUiStore } from "@/app/store/ui";
import { BrandBadge } from "@/components/layout/BrandBadge";

const navItems = [
  {
    key: "profiles",
    label: "Profiles",
    icon: Home,
    href: "/",
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const profiles = useProfilesStore((state) => state.profiles);
  const activeProfileId = useProfilesStore((state) => state.activeProfileId);
  const dirtyProfileId = useProfilesStore((state) => state.dirtyProfileId);
  const setDirtyProfileId = useProfilesStore((state) => state.setDirtyProfileId);
  const currentSidebarKey = useUiStore((state) => state.currentSidebarKey);
  const setCurrentSidebarKey = useUiStore((state) => state.setCurrentSidebarKey);

  useEffect(() => {
    setCurrentSidebarKey(location.pathname.startsWith("/settings") ? "settings" : "profiles");
  }, [location.pathname, setCurrentSidebarKey]);

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? null;

  const navigateWithGuard = (href: string, key: string) => {
    if (
      dirtyProfileId &&
      !window.confirm("You have unsaved changes. Leave this editor without saving?")
    ) {
      return;
    }

    setDirtyProfileId(null);
    setCurrentSidebarKey(key);
    navigate(href);
  };

  return (
    <div className="h-full overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="mx-auto flex h-full gap-6 p-6">
        <Card className="w-[260px] shrink-0 overflow-hidden border border-[var(--app-border)] bg-[var(--app-surface)] shadow-none">
          <CardContent className="flex h-full flex-col gap-5 p-4">
            <BrandBadge />
            <Button
              className="justify-start"
              variant="primary"
              onPress={() => {
                navigateWithGuard("/profiles/new", "profiles");
              }}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>New profile</span>
              </span>
            </Button>
            <div className="h-px bg-[var(--app-border)]" />
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSidebarKey === item.key;

                return (
                  <button
                    key={item.key}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] text-[var(--app-text)]"
                        : "border-transparent bg-transparent text-[var(--app-text-muted)] hover:border-[var(--app-border)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
                    }`}
                    type="button"
                    onClick={() => {
                      navigateWithGuard(item.href, item.key);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <p className="mt-auto text-xs text-[var(--app-text-subtle)]">
              {profiles.length} profile{profiles.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <div className="min-h-0 min-w-0 flex-1">
          <div className="flex h-full flex-col rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="flex flex-wrap items-center gap-4 border-b border-[var(--app-border)] px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                  Active profile
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--app-text)]">
                  {activeProfile?.name ?? "No active profile"}
                </h2>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.01),transparent_26%)] px-6 py-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

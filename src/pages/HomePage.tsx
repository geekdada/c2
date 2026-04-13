import { Button, Card, CardContent } from "@heroui/react";
import { Sparkles, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useProfilesStore } from "@/app/store/profiles";
import { useUiStore } from "@/app/store/ui";
import { DeleteProfileModal } from "@/features/profile-list/DeleteProfileModal";
import { ProfileList } from "@/features/profile-list/ProfileList";
import { SwitchProfileModal } from "@/features/profile-switch/SwitchProfileModal";

export function HomePage() {
  const navigate = useNavigate();
  const profiles = useProfilesStore((state) => state.profiles);
  const activeProfileId = useProfilesStore((state) => state.activeProfileId);
  const importResult = useProfilesStore((state) => state.importResult);
  const settingsSnapshot = useProfilesStore((state) => state.settingsSnapshot);
  const isSaving = useProfilesStore((state) => state.isSaving);
  const error = useProfilesStore((state) => state.error);
  const switchProfile = useProfilesStore((state) => state.switchProfile);
  const deleteProfile = useProfilesStore((state) => state.deleteProfile);
  const clearImportResult = useProfilesStore((state) => state.clearImportResult);
  const switchProfileId = useUiStore((state) => state.modals.switchProfileId);
  const deleteProfileId = useUiStore((state) => state.modals.deleteProfileId);
  const openSwitchModal = useUiStore((state) => state.openSwitchModal);
  const closeSwitchModal = useUiStore((state) => state.closeSwitchModal);
  const openDeleteModal = useUiStore((state) => state.openDeleteModal);
  const closeDeleteModal = useUiStore((state) => state.closeDeleteModal);
  const pushToast = useUiStore((state) => state.pushToast);

  const switchTarget = profiles.find((profile) => profile.id === switchProfileId) ?? null;
  const deleteTarget = profiles.find((profile) => profile.id === deleteProfileId) ?? null;

  return (
    <section className="space-y-6">
      {importResult?.status === "imported" ? (
        <Card className="border border-emerald-400/30 bg-emerald-400/10 shadow-none">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-emerald-100">
                  Imported your existing Claude credentials
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-200/80">
                  A first profile was created from the current `~/.claude/settings.json` managed env
                  keys.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onPress={() => {
                clearImportResult();
              }}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border border-rose-400/35 bg-rose-400/10 shadow-none">
          <CardContent className="flex items-start gap-3 p-5">
            <TriangleAlert className="mt-1 h-5 w-5 text-rose-200" />
            <div>
              <p className="text-sm font-semibold text-rose-100">Last operation failed</p>
              <p className="mt-1 text-sm leading-6 text-rose-200/90">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ProfileList
        activeProfileId={activeProfileId}
        profiles={profiles}
        onActivate={(profileId) => {
          openSwitchModal(profileId);
        }}
        onDelete={(profileId) => {
          openDeleteModal(profileId);
        }}
        onEdit={(profileId) => {
          navigate(`/profiles/${profileId}`);
        }}
      />

      <SwitchProfileModal
        currentManagedEnv={settingsSnapshot?.managedEnv ?? {}}
        isBusy={isSaving}
        isOpen={Boolean(switchTarget)}
        profile={switchTarget}
        onClose={closeSwitchModal}
        onConfirm={async () => {
          if (!switchTarget) {
            return;
          }

          await switchProfile(switchTarget.id);
          closeSwitchModal();
          pushToast({
            tone: "success",
            title: `Activated ${switchTarget.name}`,
            description: "Claude settings now reflect the selected managed env values.",
          });
        }}
      />

      <DeleteProfileModal
        isBusy={isSaving}
        isOnlyProfile={profiles.length === 1}
        isOpen={Boolean(deleteTarget)}
        profile={deleteTarget}
        onClose={closeDeleteModal}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await deleteProfile(deleteTarget.id);
          closeDeleteModal();
          pushToast({
            tone: "info",
            title: `Deleted ${deleteTarget.name}`,
            description: "The local profile record was removed.",
          });
        }}
      />
    </section>
  );
}

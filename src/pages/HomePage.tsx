import { Card, CardContent, toast } from "@heroui/react";
import { TriangleAlert } from "lucide-react";
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
  const settingsSnapshot = useProfilesStore((state) => state.settingsSnapshot);
  const isSaving = useProfilesStore((state) => state.isSaving);
  const error = useProfilesStore((state) => state.error);
  const switchProfile = useProfilesStore((state) => state.switchProfile);
  const deleteProfile = useProfilesStore((state) => state.deleteProfile);
  const duplicateProfile = useProfilesStore((state) => state.duplicateProfile);
  const switchProfileId = useUiStore((state) => state.modals.switchProfileId);
  const deleteProfileId = useUiStore((state) => state.modals.deleteProfileId);
  const openSwitchModal = useUiStore((state) => state.openSwitchModal);
  const closeSwitchModal = useUiStore((state) => state.closeSwitchModal);
  const openDeleteModal = useUiStore((state) => state.openDeleteModal);
  const closeDeleteModal = useUiStore((state) => state.closeDeleteModal);

  const switchTarget = profiles.find((profile) => profile.id === switchProfileId) ?? null;
  const deleteTarget = profiles.find((profile) => profile.id === deleteProfileId) ?? null;

  return (
    <section className="space-y-4">
      {error ? (
        <Card className="border border-rose-400/35 bg-rose-400/10 shadow-none">
          <CardContent className="flex items-start gap-2 p-4">
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
        onDuplicate={async (profileId) => {
          const profile = await duplicateProfile(profileId);
          toast.success(`Duplicated as ${profile.name}`, {
            description: "A full copy of the profile has been created.",
            timeout: 3600,
          });
        }}
        onEdit={(profileId) => {
          navigate(`/profiles/${profileId}`);
        }}
      />

      <SwitchProfileModal
        currentManagedEnv={settingsSnapshot?.managedEnv ?? {}}
        hasModelOverride={settingsSnapshot?.hasModelOverride ?? false}
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
          toast.success(`Activated ${switchTarget.name}`, {
            description: "Claude settings now reflect the selected managed env values.",
            timeout: 3600,
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
          toast.info(`Deleted ${deleteTarget.name}`, {
            description: "The local profile record was removed.",
            timeout: 3600,
          });
        }}
      />
    </section>
  );
}

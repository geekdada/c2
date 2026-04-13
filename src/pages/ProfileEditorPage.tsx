import { Button, Card, CardContent } from "@heroui/react";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useProfilesStore } from "@/app/store/profiles";
import { useUiStore } from "@/app/store/ui";
import { ProfileForm } from "@/features/profile-form/ProfileForm";

export function ProfileEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const profiles = useProfilesStore((state) => state.profiles);
  const isSaving = useProfilesStore((state) => state.isSaving);
  const createProfile = useProfilesStore((state) => state.createProfile);
  const updateProfile = useProfilesStore((state) => state.updateProfile);
  const setDirtyProfileId = useProfilesStore((state) => state.setDirtyProfileId);
  const pushToast = useUiStore((state) => state.pushToast);

  const profile = useMemo(() => profiles.find((candidate) => candidate.id === id), [id, profiles]);
  const mode = id ? "edit" : "create";

  const leaveEditor = (message: string) => {
    if (useProfilesStore.getState().dirtyProfileId && !window.confirm(message)) {
      return;
    }

    setDirtyProfileId(null);
    navigate("/");
  };

  if (id && !profile) {
    return (
      <Card className="border border-amber-400/35 bg-amber-400/10 shadow-none">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-1 h-5 w-5 text-amber-200" />
            <div>
              <h1 className="text-lg font-semibold text-amber-100">Profile not found</h1>
              <p className="mt-2 text-sm leading-6 text-amber-100/85">
                The requested profile no longer exists. Return to the list and choose another one.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onPress={() => {
              navigate("/");
            }}
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to profiles</span>
            </span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <Button
        variant="ghost"
        onPress={() => {
          leaveEditor("You have unsaved changes. Leave this editor without saving?");
        }}
      >
        <span className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to profiles</span>
        </span>
      </Button>

      <ProfileForm
        isSaving={isSaving}
        mode={mode}
        profile={profile}
        onCancel={() => {
          leaveEditor("Discard your unsaved changes?");
        }}
        onDirtyChange={(dirty) => {
          setDirtyProfileId(dirty ? (id ?? "new-profile") : null);
        }}
        onSubmit={async (input) => {
          if (mode === "create") {
            const createdProfile = await createProfile(input);

            pushToast({
              tone: "success",
              title: `Created ${createdProfile.name}`,
              description:
                "Activate it from the profile list when you're ready to write it into Claude settings.",
            });
          } else if (profile) {
            const updatedProfile = await updateProfile(profile.id, input);

            pushToast({
              tone: "success",
              title: `Saved ${updatedProfile.name}`,
              description: "Your local profile changes are ready for the next switch.",
            });
          }

          setDirtyProfileId(null);
          navigate("/");
        }}
      />
    </section>
  );
}

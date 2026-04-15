import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockDesktopApi } from "@/testing/mockDesktopApi";
import type { Profile } from "@/shared/profiles";

import App from "./App";
import { AppProviders } from "./providers";
import { useProfilesStore } from "./store/profiles";
import { useUiStore } from "./store/ui";

const profile: Profile = {
  id: "profile-1",
  name: "Test Profile",
  env: {
    ANTHROPIC_API_KEY: "test-api-key",
  },
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
};

function resetStores() {
  useProfilesStore.setState({
    profiles: [],
    activeProfileId: null,
    isLoading: true,
    isSaving: false,
    dirtyProfileId: null,
    settingsSnapshot: null,
    error: null,
  });

  useUiStore.setState({
    currentSidebarKey: "profiles",
    theme: "system",
    hasCompletedOnboarding: false,
    modals: {
      switchProfileId: null,
      deleteProfileId: null,
    },
  });
}

function renderApp(initialHash = "#/") {
  window.location.hash = initialHash;

  render(
    <HashRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </HashRouter>,
  );
}

async function makeEditorDirty(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("heading", { name: "Edit Test Profile" });

  const nameInput = (await screen.findByDisplayValue(profile.name)) as HTMLInputElement;

  await user.clear(nameInput);
  await user.type(nameInput, "Edited Profile");

  await waitFor(() => {
    expect(useProfilesStore.getState().dirtyProfileId).toBe(profile.id);
  });
}

describe("App", () => {
  beforeEach(() => {
    resetStores();
    window.location.hash = "#/";
  });

  afterEach(() => {
    delete window.__PROFILE_MANAGER_MOCK_API__;
    vi.restoreAllMocks();
  });

  it("shows onboarding when no profiles exist", async () => {
    window.__PROFILE_MANAGER_MOCK_API__ = createMockDesktopApi();

    renderApp();

    await waitFor(() => {
      expect(screen.getByText("Create your first C2 profile")).toBeInTheDocument();
    });
  });

  it("resets dirty state after leaving the editor from the back button", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    window.__PROFILE_MANAGER_MOCK_API__ = createMockDesktopApi({
      profiles: [profile],
      activeProfileId: profile.id,
    });

    renderApp("#/profiles/profile-1");
    await makeEditorDirty(user);

    await user.click(screen.getByRole("button", { name: "Back to profiles" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      "You have unsaved changes. Leave this editor without saving?",
    );
    expect(useProfilesStore.getState().dirtyProfileId).toBeNull();
  });

  it("clears dirty state after confirming sidebar navigation away from the editor", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    window.__PROFILE_MANAGER_MOCK_API__ = createMockDesktopApi({
      profiles: [profile],
      activeProfileId: profile.id,
    });

    renderApp("#/profiles/profile-1");
    await makeEditorDirty(user);

    await user.click(screen.getByRole("button", { name: "Settings" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    });

    expect(useProfilesStore.getState().dirtyProfileId).toBeNull();

    await user.click(screen.getByRole("button", { name: "Profiles" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    });

    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it("creates, activates, and displays advanced disable flags", async () => {
    const user = userEvent.setup();

    window.__PROFILE_MANAGER_MOCK_API__ = createMockDesktopApi({
      profiles: [profile],
      activeProfileId: profile.id,
    });

    renderApp();

    await screen.findByRole("button", { name: "New profile" });
    await user.click(screen.getByRole("button", { name: "New profile" }));

    await screen.findByRole("heading", { name: "Create a profile" });

    await user.type(screen.getByLabelText("Profile name"), "Advanced Flags");
    await user.type(screen.getByLabelText("API key"), "sk-test-123");
    await user.click(screen.getByRole("button", { name: "Advanced settings" }));
    await user.click(screen.getByLabelText("Disable 1M context"));
    await user.click(screen.getByLabelText("Disable attachments"));
    await user.click(screen.getByRole("button", { name: "Create profile" }));

    await waitFor(() => {
      expect(screen.getByText("Advanced Flags")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Activate" }));
    await screen.findByRole("button", { name: "Switch profile" });
    await user.click(screen.getByRole("button", { name: "Switch profile" }));
    await user.click(screen.getByRole("button", { name: "Settings" }));

    await screen.findByRole("heading", { name: "Settings" });
    expect(screen.getAllByText("Enabled")).toHaveLength(2);
  });

  it("refreshes Claude settings after saving the active profile", async () => {
    const user = userEvent.setup();

    window.__PROFILE_MANAGER_MOCK_API__ = createMockDesktopApi({
      profiles: [profile],
      activeProfileId: profile.id,
      managedEnv: profile.env,
    });

    renderApp("#/profiles/profile-1");

    await screen.findByRole("heading", { name: "Edit Test Profile" });

    await user.type(screen.getByLabelText("Base URL"), "https://api.example.com");
    await user.click(screen.getByRole("button", { name: "Advanced settings" }));
    await user.click(screen.getByLabelText("Disable attachments"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Settings" }));

    await screen.findByRole("heading", { name: "Settings" });
    expect(screen.getByText("https://api.example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
    expect(screen.getAllByText("Enabled")).toHaveLength(1);
  });
});

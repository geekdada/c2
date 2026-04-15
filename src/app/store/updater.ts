import { create } from "zustand";

import { getDesktopApi } from "@/app/desktopApi";
import type { UpdateStatus } from "@/shared/ipc";

type UpdaterState = {
  status: UpdateStatus;
  checkForUpdate: () => void;
  openReleasePage: () => void;
  subscribe: () => () => void;
};

export const useUpdaterStore = create<UpdaterState>((set) => ({
  status: { state: "idle" },
  checkForUpdate: () => {
    set({ status: { state: "checking" } });
    void getDesktopApi().checkForUpdate();
  },
  openReleasePage: () => {
    void getDesktopApi().openReleasePage();
  },
  subscribe: () => {
    return getDesktopApi().onUpdateStatus((status) => {
      set({ status });
    });
  },
}));

import path from "node:path";
import { fileURLToPath } from "node:url";

import { app, BrowserWindow, nativeImage, shell } from "electron";

import { registerPreferencesIpcHandlers } from "./ipc/preferences";
import { registerProfileIpcHandlers } from "./ipc/profiles";
import { registerSettingsIpcHandlers } from "./ipc/settings";
import { createAppPaths } from "./services/paths";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preload = path.join(__dirname, "preload.cjs");
function getIconFilename(): string {
  if (process.platform === "win32") return "icon.ico";
  if (process.platform === "darwin") return "icon.icns";
  return "256x256.png";
}

const iconPath = app.isPackaged
  ? path.join(process.resourcesPath, getIconFilename())
  : path.join(__dirname, "../../build/icons", getIconFilename());

let mainWindow: BrowserWindow | null = null;

async function createMainWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 760,
    backgroundColor: "#09090b",
    title: "C2",
    ...(process.platform === "darwin" && { titleBarStyle: "hiddenInset" as const }),
    icon: nativeImage.createFromPath(iconPath),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) {
      void shell.openExternal(url);
    }

    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  const paths = createAppPaths(app.getPath("home"));

  if (process.platform === "darwin") {
    app.dock?.setIcon(nativeImage.createFromPath(iconPath));
  }

  registerPreferencesIpcHandlers(paths);
  registerProfileIpcHandlers(paths);
  registerSettingsIpcHandlers(paths);
  await createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  mainWindow = null;
  app.quit();
});

import path from "node:path";
import { fileURLToPath } from "node:url";

import { app, BrowserWindow, shell } from "electron";

import { registerPreferencesIpcHandlers } from "./ipc/preferences";
import { registerProfileIpcHandlers } from "./ipc/profiles";
import { registerSettingsIpcHandlers } from "./ipc/settings";
import { createAppPaths } from "./services/paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, "../..");
const rendererDist = path.join(appRoot, "dist");
const indexHtml = path.join(rendererDist, "index.html");
const preload = path.join(appRoot, "dist-electron/preload/index.cjs");
const viteDevServerUrl = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

async function createMainWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 760,
    backgroundColor: "#09090b",
    title: "C2",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (viteDevServerUrl) {
    await mainWindow.loadURL(viteDevServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadFile(indexHtml);
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

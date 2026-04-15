import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeArch, ForgeConfig, ForgeMakeResult } from "@electron-forge/shared-types";

const ARCH_NAMES: Partial<Record<ForgeArch, string>> = {
  arm64: "aarch64",
  x64: "x86_64",
};

function normalizeArch(arch: ForgeArch): string {
  return ARCH_NAMES[arch] ?? arch;
}

function getArtifactBaseName(result: ForgeMakeResult, artifactPath: string): string | null {
  const filename = path.basename(artifactPath);
  const arch = normalizeArch(result.arch);

  switch (result.platform) {
    case "darwin":
    case "mas":
      if (filename.endsWith(".dmg") || filename.endsWith(".zip")) {
        return `darwin-${arch}`;
      }
      return null;
    case "linux":
      if (filename.endsWith(".deb")) {
        return `linux-${arch}-deb`;
      }
      return null;
    case "win32":
      if (filename.endsWith(".exe")) {
        return `windows-${arch}-nsis`;
      }
      if (filename.endsWith("-full.nupkg")) {
        return `windows-${arch}-full`;
      }
      if (filename.endsWith("-delta.nupkg")) {
        return `windows-${arch}-delta`;
      }
      return null;
    default:
      return null;
  }
}

function getRenamedArtifactPath(result: ForgeMakeResult, artifactPath: string): string {
  const baseName = getArtifactBaseName(result, artifactPath);
  if (!baseName) {
    return artifactPath;
  }

  return path.join(path.dirname(artifactPath), `${baseName}${path.extname(artifactPath)}`);
}

async function updateWindowsReleaseManifest(
  releasesPath: string,
  renamedFiles: Map<string, string>,
): Promise<void> {
  if (renamedFiles.size === 0) {
    return;
  }

  let manifest = await readFile(releasesPath, "utf8");
  for (const [oldName, newName] of renamedFiles) {
    manifest = manifest.replaceAll(oldName, newName);
  }
  await writeFile(releasesPath, manifest);
}

async function renameArtifacts(makeResults: ForgeMakeResult[]): Promise<ForgeMakeResult[]> {
  return Promise.all(
    makeResults.map(async (result) => {
      const renamedWindowsFiles = new Map<string, string>();
      const artifacts = await Promise.all(
        result.artifacts.map(async (artifactPath) => {
          const renamedPath = getRenamedArtifactPath(result, artifactPath);
          if (renamedPath === artifactPath) {
            return artifactPath;
          }

          await rename(artifactPath, renamedPath);
          renamedWindowsFiles.set(path.basename(artifactPath), path.basename(renamedPath));
          return renamedPath;
        }),
      );

      const releasesPath = artifacts.find(
        (artifactPath) => path.basename(artifactPath) === "RELEASES",
      );
      if (result.platform === "win32" && releasesPath) {
        await updateWindowsReleaseManifest(releasesPath, renamedWindowsFiles);
      }

      return { ...result, artifacts };
    }),
  );
}

const config: ForgeConfig = {
  packagerConfig: {
    name: "C2",
    executableName: "c2-app",
    icon: "./build/icons/icon",
    appBundleId: "dev.royli.c2",
    appCategoryType: "public.app-category.developer-tools",
    extendInfo: {
      CFBundleDisplayName: "C2",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "C2",
        icon: "./build/icons/icon.icns",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: {},
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "C2",
        setupIcon: "./build/icons/icon.ico",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          name: "c2",
          productName: "C2",
          icon: "./build/icons/256x256.png",
          categories: ["Development"],
        },
      },
    },
  ],
  hooks: {
    postMake: async (_forgeConfig, makeResults) => renameArtifacts(makeResults),
  },
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "electron/main.ts",
          config: "vite.main.config.ts",
        },
        {
          entry: "electron/preload.ts",
          config: "vite.preload.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
  ],
};

export default config;

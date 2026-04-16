#!/usr/bin/env bash
set -euo pipefail

# Updates the Homebrew cask in geekdada/homebrew-tap for a given release version.
# Usage: ./scripts/update-homebrew.sh <version>
# Example: ./scripts/update-homebrew.sh 0.2.3
#
# Expects release assets to already exist at:
#   https://github.com/geekdada/c2-app/releases/download/v<version>/darwin-aarch64.dmg
#   https://github.com/geekdada/c2-app/releases/download/v<version>/darwin-universal.dmg

REPO="geekdada/c2"
TAP_REPO="geekdada/homebrew-tap"
CASK_NAME="c2"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION="$1"
TAG="v${VERSION}"
BASE_URL="https://github.com/${REPO}/releases/download/${TAG}"

ASSETS=(
  "darwin-aarch64.dmg"
  "darwin-universal.dmg"
)

declare -A SHAS

for asset in "${ASSETS[@]}"; do
  url="${BASE_URL}/${asset}"
  echo "Downloading ${asset}..."
  sha=$(curl -fsSL "$url" | shasum -a 256 | awk '{print $1}')
  SHAS["$asset"]="$sha"
  echo "  SHA256: $sha"
done

CASK=$(cat <<RUBY
cask "${CASK_NAME}" do
  version "${VERSION}"

  on_arm do
    sha256 "${SHAS[darwin-aarch64.dmg]}"
    url "${BASE_URL}/darwin-aarch64.dmg"
  end

  on_intel do
    sha256 "${SHAS[darwin-universal.dmg]}"
    url "${BASE_URL}/darwin-universal.dmg"
  end

  name "C2"
  desc "Desktop app for managing multiple Anthropic API credential profiles"
  homepage "https://github.com/${REPO}"

  app "C2.app"

  zap trash: [
    "~/Library/Application Support/c2-app",
    "~/Library/Preferences/dev.royli.c2.plist",
    "~/Library/Caches/dev.royli.c2",
    "~/Library/Saved Application State/dev.royli.c2.savedState",
  ]
end
RUBY
)

echo ""
echo "Generated cask:"
echo "$CASK"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo ""
echo "Cloning ${TAP_REPO}..."
gh repo clone "$TAP_REPO" "$TMPDIR/homebrew-tap" -- --depth 1

cd "$TMPDIR/homebrew-tap"
git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/${TAP_REPO}.git"

mkdir -p "$TMPDIR/homebrew-tap/Casks"
echo "$CASK" > "$TMPDIR/homebrew-tap/Casks/${CASK_NAME}.rb"

git add "Casks/${CASK_NAME}.rb"
if git diff --cached --quiet; then
  echo "No changes to cask."
else
  git commit -m "Update ${CASK_NAME} to ${VERSION}"
  git push origin HEAD:master
  echo "Cask pushed to ${TAP_REPO}."
fi

#!/bin/bash

set -e

cd "$(dirname "$0")/.."

if [ $# -eq 0 ]; then
  echo "Usage: bun release <patch|minor|major>"
  exit 1
fi

VERSION_TYPE=$1
current_version=$(node -p "require('./package.json').version")
echo "Current version: $current_version"

major=$(echo "$current_version" | cut -d. -f1)
minor=$(echo "$current_version" | cut -d. -f2)
patch=$(echo "$current_version" | cut -d. -f3)

case "$VERSION_TYPE" in
  patch)
    patch=$((patch + 1))
    ;;
  minor)
    minor=$((minor + 1))
    patch=0
    ;;
  major)
    major=$((major + 1))
    minor=0
    patch=0
    ;;
  *)
    echo "Invalid version type. Use: patch, minor, or major"
    exit 1
    ;;
esac

new_version="$major.$minor.$patch"
echo "Bumping to: $new_version"

sed -i "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" package.json

git add package.json
git commit -m "chore: release v$new_version"
git tag "v$new_version"

echo "Pushing to origin..."
git push origin main --tags

echo ""
echo "Released v$new_version"
echo "GitHub Actions will publish to npm"

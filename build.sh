#!/usr/bin/env bash
# Builds two loadable extension folders from the shared source:
#   dist/full  - live phone frames (header stripping + optional cookie fix), GitHub / unpacked use
#   dist/lite  - no risky permissions, apps open in phone-sized windows (store friendly)
set -e
cd "$(dirname "$0")"
rm -rf dist
mkdir -p dist/full dist/lite
for v in full lite; do
  cp src/sites.js src/newtab.html src/newtab.css src/newtab.js "dist/$v/"
  cp "manifests/$v.json" "dist/$v/manifest.json"
done
cp src/background.js dist/full/
echo "Built dist/full and dist/lite"

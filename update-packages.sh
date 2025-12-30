#!/bin/bash

echo "Updating packages..."
echo "Tips: you can use 'npm run update-packages' to update the packages"
npm i lighthouse-plugin-ecoindex-courses@latest
cd lib && rm -rf node_modules && npm i lighthouse@latest lighthouse-plugin-ecoindex-core@latest lighthouse-plugin-ecoindex-courses@latest --save --save-exact
cd .. && npm run premake && rm -rf out/* --yes && rm -rf .webpack/* --yes
echo "Packages updated"
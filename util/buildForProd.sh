#!/usr/bin/env bash

### Bundle BackEnd ###
# Remove existing production folder
rm -rf ./build/
# Transpile .ts to .js
tsc --sourceMap false

### Bundle FrontEnd ###

# Create the directory for React
mkdir -p ./build/public/react/

# Navigate to the react directory
cd ./src/public/react/dossard-react

# Build React code
npm run build

# Rename the folder
mv build dossard-react

# Move the contains to the build/ dir
mv dossard-react ../../../../build/public/react/

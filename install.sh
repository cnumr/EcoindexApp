#!/bin/bash

echo "Installing dependencies..."
npm ci
echo "Dependencies installed"
echo "Running premake..."
npm run "premake"
echo "Premake completed"
echo "Installing lib dependencies..."
cd lib && npm ci
echo "Lib dependencies installed"
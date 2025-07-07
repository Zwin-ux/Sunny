#!/bin/bash
# Exit on error
set -e

# Install dependencies using npm
npm install

# Build the Next.js application
npm run build

echo "Build completed successfully!"

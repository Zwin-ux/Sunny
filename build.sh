#!/bin/bash
# Exit on error
set -e

echo "Installing dependencies..."
npm install

# Install shadcn if not already installed
if [ ! -d "node_modules/.bin/shadcn" ]; then
  echo "Installing shadcn..."
  npx shadcn@latest init --yes
fi

# Add common UI components
echo "Adding UI components..."
npx shadcn@latest add button card input form select dropdown-menu badge

# Build the Next.js application
echo "Building application..."
npm run build

echo "Build completed successfully!"

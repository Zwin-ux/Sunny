#!/bin/bash
# Exit on error
set -e

echo "Installing dependencies..."
npm install

# Install shadcn/ui if not already installed
if [ ! -d "node_modules/.bin/shadcn-ui" ]; then
  echo "Installing shadcn-ui..."
  npx shadcn-ui@latest init
fi

# Add common UI components
echo "Adding UI components..."
npx shadcn-ui@latest add button card input form select dropdown-menu

# Build the Next.js application
echo "Building application..."
npm run build

echo "Build completed successfully!"

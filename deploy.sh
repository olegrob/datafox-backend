#!/bin/bash

# Build the production version
echo "Building production version..."
npm run build

# Stop the existing PM2 process if it exists
echo "Stopping existing process..."
pm2 stop datafox || true

# Start the new version with PM2
echo "Starting new version..."
pm2 start npm --name "datafox" -- start

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

echo "Deployment complete!"

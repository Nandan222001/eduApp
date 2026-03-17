#!/bin/bash

# Make all script files executable

echo "Making scripts executable..."

chmod +x scripts/*.sh
chmod +x scripts/*.js

echo "✅ All scripts are now executable"
echo ""
echo "Available scripts:"
ls -l scripts/*.sh scripts/*.js

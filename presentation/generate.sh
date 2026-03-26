#!/bin/bash
# Bash script to generate the presentation
# Usage: ./generate.sh

echo "=================================================="
echo "  Educational SaaS Platform - Presentation Generator"
echo "=================================================="
echo ""

# Check if python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python is not installed or not in PATH"
    echo "Please install Python 3.11+ and try again"
    exit 1
fi

# Check Python version
echo "Checking Python version..."
python3 --version
echo ""

# Check if python-pptx is installed
echo "Checking for python-pptx dependency..."
if ! python3 -c "import pptx" 2>/dev/null; then
    echo "  python-pptx is not installed"
    echo "  Installing python-pptx..."
    pip3 install python-pptx
    if [ $? -ne 0 ]; then
        echo "  Error: Failed to install python-pptx"
        exit 1
    fi
    echo "  ✓ python-pptx installed successfully"
else
    echo "  ✓ python-pptx is already installed"
fi

# Generate the presentation
echo ""
echo "Generating presentation..."
echo ""

python3 create_presentation.py

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "  ✓ Presentation generated successfully!"
    echo "=================================================="
    echo ""
    echo "The PowerPoint file is ready:"
    echo "  Educational_SaaS_Platform_Presentation.pptx"
    echo ""
else
    echo ""
    echo "=================================================="
    echo "  ✗ Error: Failed to generate presentation"
    echo "=================================================="
    echo ""
    echo "Please check the error messages above"
    exit 1
fi

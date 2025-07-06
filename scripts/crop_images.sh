#!/bin/bash

# Script to crop story images to circles with transparency
# This script will process all PNG files in public/story/ except the already cropped one
# Run from the project root: ./scripts/crop_images.sh

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to the project root directory
cd "$PROJECT_ROOT"

# Ensure we have the correct directory structure
if [ ! -d "public/story" ]; then
    echo "Error: public/story directory not found. Please run this script from the project root."
    exit 1
fi

# Change to the story directory
cd public/story

# Array of files to process (excluding the already cropped one)
files=(
    "An abstract and cute anime-style image of _character_ optimizing app performance, showing speed lines and efficient data flow, handling many users at once, vibrant colors, and a cheerful mood..png"
    "An abstract and cute anime-style image of _character_ crafting the backend features of an app, showing gears and smooth-working mechanisms behind the scenes, vibrant colors, and a cheerful mood..png"
    "An abstract and cute anime-style image of _character_ sketching out ideas for app design, with beautiful interfaces and user-friendly elements, vibrant colors, and a cheerful mood..png"
    "An abstract and cute anime-style image of _character_ building a user interface that looks great and accommodates mobile, tablet, and desktop users, with responsive design elements, vibrant colors, and a cheerful mood..png"
    "An abstract and cute anime-style image of _character_ protecting data with encryption, showing a lock and a shield, keeping out bad guys, vibrant colors, and a cheerful mood..png"
    "An abstract and cute anime-style image of _character_ with cloud hosting, showing a cloud with app icons and 24_7 availability, vibrant colors, and a cheerful mood..png"
    "An abstract and cute anime-style image of _character_ with powerful servers hosting the app, automatically scaling up with more users, showing server racks and expanding capacity, vibrant colors, and a cheerful mood..png"
    "cheerful_anime_programmer.png"
)

echo "Starting image processing..."
echo "Working directory: $(pwd)"

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Create a backup of the original
        cp "$file" "${file}.backup"
        
        # Get the dimensions of the image
        width=$(magick identify -format "%w" "$file")
        height=$(magick identify -format "%h" "$file")
        
        # Calculate the size for the circle (use the smaller dimension)
        if [ $width -lt $height ]; then
            size=$width
        else
            size=$height
        fi
        
        # Create a circle crop with transparency
        magick "$file" \
            -resize "${size}x${size}^" \
            -gravity center \
            -extent "${size}x${size}" \
            \( +clone -threshold 101% -fill white -draw "circle $((size/2)),$((size/2)) $((size/2)),0" \) \
            -alpha off -compose copy_opacity -composite \
            "$file"
        
        echo "✓ Completed: $file"
    else
        echo "⚠ File not found: $file"
    fi
done

echo "All images processed successfully!"
echo "Original files are backed up with .backup extension" 
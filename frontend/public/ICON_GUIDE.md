# PWA Icon Setup Guide

## Current Status
Placeholder SVG icon has been created at `public/icon.svg`. You need to convert this to PNG files in multiple sizes.

## Required Icon Sizes
- 72x72.png
- 96x96.png
- 128x128.png
- 144x144.png
- 152x152.png
- 192x192.png
- 384x384.png
- 512x512.png

## How to Generate Icons

### Option 1: Online Tool (Easiest)
1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload `icon.svg` or your custom icon
3. Download all sizes
4. Place them in the `public/` folder

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first, then:
magick convert icon.svg -resize 72x72 icon-72x72.png
magick convert icon.svg -resize 96x96 icon-96x96.png
magick convert icon.svg -resize 128x128 icon-128x128.png
magick convert icon.svg -resize 144x144 icon-144x144.png
magick convert icon.svg -resize 152x152 icon-152x152.png
magick convert icon.svg -resize 192x192 icon-192x192.png
magick convert icon.svg -resize 384x384 icon-384x384.png
magick convert icon.svg -resize 512x512 icon-512x512.png
```

### Option 3: Using Online SVG to PNG Converter
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Set custom sizes for each icon
4. Download and rename files accordingly

### Option 4: Design Custom Icon
Create a professional icon using:
- Figma (https://figma.com)
- Canva (https://canva.com)
- Adobe Illustrator

Design guidelines:
- Use the app's theme color: #10b981 (Emerald Green)
- Keep it simple and recognizable at small sizes
- Ensure good contrast
- Consider using a money/finance symbol (dollar sign, wallet, chart, etc.)

## Apple Touch Icon (iOS)
Also create `apple-touch-icon.png` (180x180) for iOS devices:
```bash
magick convert icon.svg -resize 180x180 apple-touch-icon.png
```

## After Generating Icons
1. Place all PNG files in `frontend/public/` folder
2. Restart the Next.js dev server
3. Build the app: `npm run build`
4. Test PWA installation in browser

## Testing PWA
1. Build the app: `npm run build && npm start`
2. Open Chrome DevTools → Application → Manifest
3. Check for any errors
4. Try "Add to Home Screen" on mobile or "Install" on desktop


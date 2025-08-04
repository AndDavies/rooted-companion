# Public Assets

This directory contains static assets that are served directly by Next.js.

## Directory Structure

```
public/
├── images/          # General images, photos, illustrations
├── icons/           # Icon files (SVG, PNG, ICO)
├── fonts/           # Custom font files (if needed)
├── logos/           # Brand logos and marks
└── favicon.ico      # Site favicon (already exists)
```

## Usage

### In Next.js Components

```tsx
// Images
<img src="/images/hero-image.jpg" alt="Hero" />

// Icons
<img src="/icons/arrow-right.svg" alt="Arrow" />

// Logos
<img src="/logos/garmin-logo.png" alt="Garmin" />
```

### In CSS/Tailwind

```css
/* Background images */
.hero {
  background-image: url('/images/hero-bg.jpg');
}
```

### In Next.js Image Component

```tsx
import Image from 'next/image'

<Image 
  src="/images/hero-image.jpg" 
  alt="Hero"
  width={800}
  height={600}
/>
```

## File Types Supported

- **Images**: JPG, JPEG, PNG, WebP, GIF, SVG
- **Icons**: SVG, PNG, ICO
- **Fonts**: WOFF, WOFF2, TTF, OTF
- **Documents**: PDF, DOC, etc.

## Best Practices

1. **Optimize images** before adding to public folder
2. **Use descriptive names** for files
3. **Organize by type** in appropriate subdirectories
4. **Keep file sizes reasonable** for performance
5. **Use Next.js Image component** when possible for optimization

## Next.js Configuration

Next.js automatically serves files from the `public` directory at the root URL path. No additional configuration is needed.

Example:
- `public/images/logo.png` → accessible at `/images/logo.png`
- `public/favicon.ico` → accessible at `/favicon.ico`

## Current Assets

- `favicon.ico` - Site favicon (existing)
- `images/` - Ready for hero images, backgrounds, etc.
- `icons/` - Ready for UI icons, navigation icons, etc.
- `logos/` - Ready for brand logos (Garmin, etc.)
- `fonts/` - Ready for custom fonts if needed 
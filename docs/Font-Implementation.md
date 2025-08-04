# Font Implementation

## Font Setup

### Primary Font: Josefin Sans
- **Location**: `public/fonts/Josefin_Sans/`
- **Usage**: Main body text, UI elements, general content
- **Weights**: 100 (Thin) to 700 (Bold) with italic variants
- **CSS Variable**: `--font-josefin-sans`
- **Tailwind Class**: `font-sans`

### Logo Font: Cinzel
- **Location**: `public/fonts/Cinzel/`
- **Usage**: Branding, headings, "ROOTED" text
- **Weights**: 100 to 900 (variable font)
- **CSS Variable**: `--font-cinzel`
- **Tailwind Class**: `font-logo`

## Implementation Details

### Font Loading
- Uses Next.js `localFont` for optimal performance
- Individual weight files for Josefin Sans (better performance)
- Variable font for Cinzel
- `display: "swap"` for better loading experience

### Font Usage

#### Headings & Branding
```tsx
// Logo/brand text
<h1 className="font-logo font-semibold">ROOTED</h1>

// Main headings
<h2 className="font-logo font-bold">Your Recovery Journey</h2>
```

#### Body Text
```tsx
// Default body text (Josefin Sans)
<p className="text-neutral-600">Regular content</p>

// Explicit sans font
<p className="font-sans">Josefin Sans text</p>
```

## Files Updated

### Layout Configuration
- `app/layout.tsx` - Font loading and CSS variables
- `tailwind.config.ts` - Font family definitions

### Components Updated
- `components/ui/DashboardNav.tsx` - Logo branding
- `app/page.tsx` - Landing page headings
- `app/login/page.tsx` - Login page branding
- `app/signup/page.tsx` - Signup page branding
- `app/(dashboard)/dashboard/page.tsx` - Dashboard headings
- `app/(dashboard)/dashboard/settings/page.tsx` - Settings headings
- `app/(dashboard)/dashboard/settings/integrations/page.tsx` - Integration headings

## Font Hierarchy

1. **Logo/Brand**: Cinzel (`font-logo`)
   - "ROOTED" branding
   - Main page headings
   - Feature titles

2. **Body Content**: Josefin Sans (`font-sans`)
   - Paragraphs
   - UI elements
   - Navigation text
   - Form labels

## Performance Optimizations

- Individual weight files for Josefin Sans
- Variable font for Cinzel
- Font display swap for better loading
- Removed unused Geist fonts
- Optimized font loading paths

## Testing

The fonts are now properly implemented throughout the site:
- ✅ Josefin Sans as primary font
- ✅ Cinzel for branding and headings
- ✅ All pages updated
- ✅ Build successful
- ✅ No font conflicts 
# Responsive Dashboard Layout

This document outlines the full-width responsive dashboard layout implementation inspired by Wealthsimple.

## Layout Structure

### Dashboard Layout (`app/(dashboard)/layout.tsx`)
- **Full-width container**: Uses `w-full` instead of `max-w-*`
- **Responsive padding**: `px-4 sm:px-6 lg:px-8`
- **Background**: `bg-[#fcfcfc] min-h-screen`
- **Vertical scroll safety**: Proper overflow handling

### Navigation (`components/ui/DashboardNav.tsx`)
- **Sticky positioning**: `sticky top-0 z-50`
- **Full-width**: `w-full px-4 sm:px-6 lg:px-8`
- **Mobile-first**: Responsive breakpoints throughout

## Responsive Breakpoints

### Mobile (< 640px)
- Single column layouts
- Hamburger menu navigation
- Compact spacing (`gap-4`)
- Smaller typography (`text-2xl`)

### Tablet (640px - 1024px)
- Two-column grids (`md:grid-cols-2`)
- Desktop navigation visible
- Medium spacing (`sm:gap-6`)
- Medium typography (`sm:text-3xl`)

### Desktop (> 1024px)
- Three-column grids (`lg:grid-cols-3`)
- Full navigation with all buttons
- Large spacing (`lg:px-8`)
- Large typography

## Navigation Features

### Desktop Navigation
- Horizontal button layout
- All navigation items visible
- Proper spacing with `gap-4`

### Mobile Navigation
- Hamburger menu toggle
- Vertical menu overlay
- Smooth transitions
- Auto-close on navigation

### Responsive Branding
- **Desktop**: Full "ROOTED Dashboard" with welcome message
- **Mobile**: Compact "ROOTED" branding

## Grid System

### Dashboard Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

### Settings Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
```

## Typography Scale

### Headers
- **Mobile**: `text-2xl`
- **Desktop**: `sm:text-3xl`

### Body Text
- Consistent `text-neutral-600` for descriptions
- Proper line heights and spacing

## Spacing System

### Horizontal Padding
- **Mobile**: `px-4`
- **Tablet**: `sm:px-6`
- **Desktop**: `lg:px-8`

### Vertical Spacing
- **Mobile**: `gap-4`
- **Desktop**: `sm:gap-6`

### Component Spacing
- **Cards**: `space-y-8` for main sections
- **Navigation**: `gap-4` for buttons
- **Content**: `py-6` for main content area

## Mobile Optimizations

### Touch Targets
- Minimum 44px touch targets
- Proper button sizing (`size="sm"`)
- Adequate spacing between interactive elements

### Navigation
- Hamburger menu for mobile
- Full-width mobile menu
- Easy-to-tap navigation items

### Content
- Single column layouts on mobile
- Readable typography
- Proper content hierarchy

## Performance Considerations

### Client-Side Navigation
- Uses `'use client'` for interactive navigation
- Proper state management for mobile menu
- Efficient re-renders

### Server Components
- Widgets remain server components
- Data fetching at component level
- Proper TypeScript typing

## Accessibility

### Keyboard Navigation
- Proper focus management
- Logical tab order
- Keyboard-accessible mobile menu

### Screen Readers
- Semantic HTML structure
- Proper ARIA labels
- Descriptive link text

### Color Contrast
- Meets WCAG AA standards
- Proper contrast ratios
- Accessible color palette

## Future Enhancements

### Potential Improvements
- Sidebar navigation for larger screens
- Breadcrumb navigation
- Search functionality
- Notification system
- User preferences panel

### Responsive Patterns
- Collapsible sidebar
- Floating action buttons
- Bottom sheet navigation
- Swipe gestures 
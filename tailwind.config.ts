import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-josefin-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-cinzel)', 'Georgia', 'serif'],
        logo: ['var(--font-cinzel)', 'Georgia', 'serif'],
      },
      colors: {
        // shadcn/ui color system
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          green: '#15803d', // Custom green accent
          tan: '#d97706', // Custom tan accent
          gold: '#f59e0b', // Custom gold accent
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        container: '1280px',
      },
      padding: {
        container: '1rem',
      },
      transitionDuration: {
        '200': '200ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Custom component classes
    function({ addComponents, theme }: { addComponents: any; theme: any }) {
      addComponents({
        // Container component
        '.container-custom': {
          maxWidth: theme('maxWidth.container'),
          margin: '0 auto',
          padding: `0 ${theme('padding.container')}`,
          '@screen sm': {
            padding: `0 ${theme('spacing.6')}`,
          },
          '@screen lg': {
            padding: `0 ${theme('spacing.8')}`,
          },
        },
        
        // Section spacing
        '.section': {
          padding: `${theme('spacing.16')} 0`,
          '@screen sm': {
            padding: `${theme('spacing.24')} 0`,
          },
        },
        
        // Typography utilities
        '.text-heading': {
          fontFamily: theme('fontFamily.logo'),
          fontWeight: '700',
          lineHeight: '1.2',
        },
        '.text-body': {
          fontFamily: theme('fontFamily.sans'),
          lineHeight: '1.6',
        },
        
        // Interactive elements
        '.interactive': {
          transition: 'all 200ms',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        
        // Link styles
        '.link': {
          color: theme('colors.accent.green'),
          textDecoration: 'none',
          transition: 'all 200ms',
          '&:hover': {
            textDecoration: 'underline',
            color: theme('colors.accent.green'),
            filter: 'brightness(0.8)',
          },
        },
      })
    },
  ],
}

export default config

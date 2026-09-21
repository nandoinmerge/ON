import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./apps/web/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Roxo da marca (extraído do logo real da ON Digital, #5F368B como âncora).
        // brand-600 é a cor oficial; os demais tons são derivados dela.
        brand: {
          900: '#2E1A45',
          700: '#4A2A6D',
          600: '#5F368B',
          400: '#8C63B3',
          200: '#D9C7EA',
          100: '#EFE8F5',
          50: '#F7F4FA',
        },
        // Tons de tinta para a navegação lateral escura (efeito preto + roxo).
        ink: {
          DEFAULT: '#111114',
          soft: '#242429',
        },
        canvas: '#FFFFFF',
        background: '#F6F6F8',
        surface: '#FFFFFF',
        'surface-muted': '#FAFAFB',
        text: {
          primary: '#18181B',
          secondary: '#52525B',
          tertiary: '#A1A1AA',
        },
        border: {
          subtle: '#E7E7EB',
          strong: '#D3DAE1',
        },
        status: {
          success: {
            bg: '#DCFCE7',
            fg: '#16A34A',
          },
          warning: {
            bg: '#FEF3C7',
            fg: '#D97706',
          },
          danger: {
            bg: '#FEE2E2',
            fg: '#DC2626',
          },
          info: {
            bg: '#DBEAFE',
            fg: '#2563EB',
          },
          amber: {
            bg: '#FEF3C7',
            fg: '#D97706',
            solid: '#D97706',
          },
        },
        logo: {
          purple: {
            600: '#5F368B',
            400: '#8C63B3',
            100: '#EFE8F5',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['34px', { lineHeight: '1.1', fontWeight: '800' }],
        h1: ['26px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(17, 17, 20, 0.04), 0 1px 3px 0 rgba(17, 17, 20, 0.06)',
        'soft-lg': '0 4px 12px -2px rgba(17, 17, 20, 0.08)',
        glow: '0 0 60px -15px rgba(95, 54, 139, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;

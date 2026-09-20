import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./apps/web/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0A2A45',
          700: '#123E63',
          600: '#1A5686',
          400: '#4E86B3',
          200: '#CADCEA',
          100: '#E8F0F7',
          50: '#F4F8FB',
        },
        canvas: '#FFFFFF',
        surface: '#FAFBFC',
        text: {
          primary: '#1D2530',
          secondary: '#647082',
          tertiary: '#98A2B0',
        },
        border: {
          subtle: '#E7EBEF',
          strong: '#D3DAE1',
        },
        status: {
          success: {
            bg: '#E7F1E9',
            fg: '#3D6B4A',
          },
          warning: {
            bg: '#FBF0DE',
            fg: '#8A6420',
          },
          danger: {
            bg: '#FBE7E7',
            fg: '#A23C3C',
          },
          amber: {
            bg: '#FFEBDD',
            fg: '#B3540F',
            solid: '#FF6A28',
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
    },
  },
  plugins: [],
};

export default config;

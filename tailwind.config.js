/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef7ff",
          100: "#d9ecff",
          200: "#b5d8ff",
          300: "#86bfff",
          400: "#57a6ff",
          500: "#2f8dff",   // primary blue
          600: "#1f73e6",
          700: "#1a5bb8",
          800: "#174c96",
          900: "#153f7a",
        },
      },
      backgroundImage: {
        'radial-dots':
          'radial-gradient(12px 12px at 20px 20px, rgba(79,70,229,0.08) 2px, transparent 2px)',
        'hero-glow':
          'radial-gradient(800px 400px at 50% 0%, rgba(47,141,255,0.20), transparent 60%)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
      },
      boxShadow: {
        soft: '0 10px 25px -5px rgba(0,0,0,0.07), 0 8px 10px -6px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
};


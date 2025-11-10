// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-yellow": "#F4E48E",
        "brand-teal": "#4E747B",
        "brand-gold": "#A48952",
        "brand-teal-dark": "#3D5C62",
        "brand-teal-light": "#6B9CA5",
        "brand-yellow-light": "#F9F0C3",
        "brand-yellow-dark": "#E8D56B",
      },
      boxShadow: {
        "glow-yellow": "0 0 20px rgba(244, 228, 142, 0.3)",
        "glow-teal": "0 0 20px rgba(78, 116, 123, 0.3)",
        premium: "0 10px 40px rgba(0, 0, 0, 0.1)",
        "premium-hover": "0 15px 50px rgba(0, 0, 0, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        gradient: "gradient 3s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand": "linear-gradient(135deg, #4E747B 0%, #F4E48E 100%)",
        "gradient-brand-hover":
          "linear-gradient(135deg, #3D5C62 0%, #E8D56B 100%)",
      },
    },
  },
  plugins: [],
};

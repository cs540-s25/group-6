/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'primary-color': '#5e72e4',
        'primary-light': '#8799ff',
        'primary-dark': '#4355b9',
        'secondary-color': '#fb6340',
        'secondary-light': '#ff8c70',
        'secondary-dark': '#e33f1e',
        'success-color': '#2dce89',
        'warning-color': '#ffbd38',
        'danger-color': '#f5365c',
        'info-color': '#11cdef',
      },
      boxShadow: {
        'sm-custom': '0 2px 5px rgba(50, 50, 93, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)',
        'md-custom': '0 4px 12px rgba(50, 50, 93, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)',
        'lg-custom': '0 8px 16px rgba(50, 50, 93, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl-custom': '12px',
      },
    },
  },
  plugins: [],
}
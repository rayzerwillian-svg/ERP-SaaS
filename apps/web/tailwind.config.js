const preset = require('@erp-saas/config/tailwind.preset');

module.exports = {
  presets: [preset],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
};

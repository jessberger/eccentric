import type { NextConfig } from 'next';
const config: NextConfig = {
  outputFileTracingIncludes: {
    '/offers/*/pdf': ['./assets/pdf-fonts/*.ttf', './pics/logo.jpg'],
  },
};
export default config;

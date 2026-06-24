import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://healthybmicheck.com',
  integrations: [
    sitemap({
      // Exclude utility/redirect pages from sitemap
      filter: (page) => !page.includes('pinterest'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  build: {
    format: 'file',
  },
  image: {
    // Auto-optimize images with Astro's built-in Sharp processor
    // Use <Image> from 'astro:assets' in .astro files for WebP + lazy loading
    remotePatterns: [{ protocol: 'https' }],
  },
});

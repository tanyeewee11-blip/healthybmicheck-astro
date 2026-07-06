import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://healthybmicheck.com',
  integrations: [
    sitemap({
      // Exclude utility pages, and deprecated age/height template pages that
      // now 301-redirect to hub pages (healthy-bmi-by-age / healthy-weight-by-height).
      // These shouldn't be submitted to Google as pages to index — they no
      // longer serve their own content.
      filter: (page) => {
        if (page.includes('pinterest')) return false;
        if (/healthy-bmi-\d+-year-old-(female|male)/.test(page)) return false;
        if (/healthy-weight-(\d+cm|\d+ft(\d+in)?)-(female|male)/.test(page)) return false;
        return true;
      },
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

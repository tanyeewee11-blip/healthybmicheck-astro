import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';

// Build a slug -> real last-modified-date map by reading each page's own
// embedded schema.org JSON-LD (dateModified, falling back to datePublished).
// Previously every page's <lastmod> was stamped with the build timestamp
// (`lastmod: new Date()`), which meant ALL 160 pages showed the same
// "just changed" date on every single deploy — even pages nobody touched.
// That makes the signal meaningless to Google. Pages with no date found
// simply omit <lastmod> rather than getting a fake one.
const pagesDir = new URL('./src/pages/', import.meta.url);
const lastmodMap = {};

function extractDate(content) {
  const m = content.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  if (m) return m[1];
  const p = content.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  return p ? p[1] : null;
}

try {
  for (const file of fs.readdirSync(pagesDir)) {
    if (!file.endsWith('.astro')) continue;
    const content = fs.readFileSync(new URL(file, pagesDir), 'utf-8');
    const date = extractDate(content);
    if (!date) continue;
    // @astrojs/sitemap emits clean URLs without a .html extension
    // (e.g. https://.../water-intake), so the map key must match that,
    // not the physical .html filename Astro builds to disk.
    const slug = file === 'index.astro' ? '' : file.replace(/\.astro$/, '');
    lastmodMap[slug] = date;
  }
} catch (e) {
  console.warn('[sitemap lastmod] could not read src/pages for dateModified extraction:', e.message);
}

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
      serialize(item) {
        const slug = new URL(item.url).pathname.replace(/^\//, '');
        const date = lastmodMap[slug];
        if (date) {
          item.lastmod = date;
        } else {
          delete item.lastmod;
        }
        return item;
      },
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

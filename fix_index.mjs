import { readFileSync, writeFileSync } from 'fs';

let html = readFileSync('src/pages/index.astro', 'utf-8');

// Fix 1: "Learn & Understand" section - make title centered by removing flex layout
// The issue is display:flex on the div containing h2 and "View all guides" link
// Change to text-align:center layout
html = html.replace(
  /<div style="display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:24px;">\s*<h2 class="section-title" style="margin-bottom:0;">Learn & Understand<\/h2>\s*<a href="guides\/index\.html"/,
  '<div style="text-align:center;margin-bottom:24px;">\n      <h2 class="section-title" style="margin-bottom:8px;">Learn &amp; Understand</h2>\n      <a href="guides/index.html"'
);

// Fix 2: About section - center the text div
html = html.replace(
  '<div style="max-width: 720px; color: var(--ink2); font-size: 0.975rem; line-height: 1.8;">',
  '<div style="max-width: 720px; color: var(--ink2); font-size: 0.975rem; line-height: 1.8; margin: 0 auto;">'
);

writeFileSync('src/pages/index.astro', html, 'utf-8');
console.log('Done');

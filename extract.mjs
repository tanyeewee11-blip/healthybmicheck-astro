import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';

const src = '../healthybmicheck';
const dst = 'src/pages';

const skip = ['404.html'];
const files = readdirSync(src).filter(f => f.endsWith('.html') && !skip.includes(f));

let count = 0;

for (const file of files) {
  const html = readFileSync(`${src}/${file}`, 'utf-8');

  const titleM = html.match(/<title>(.*?)<\/title>/);
  const descM = html.match(/<meta name="description" content="(.*?)"/);
  const canonM = html.match(/<link rel="canonical" href="(.*?)"/);

  const title = (titleM ? titleM[1] : '').replace(/"/g, '&quot;');
  const desc = (descM ? descM[1] : '').replace(/"/g, '&quot;');
  const canon = canonM ? canonM[1] : '';

  // Extract body content between </header> and <footer
  const start = html.indexOf('</header>') + 9;
  const end = html.indexOf('<footer');
  let main = '';
  if (start > 9 && end > 0) {
    main = html.slice(start, end).trim();
  } else {
    const mainM = html.match(/<main[\s\S]*?<\/main>/);
    main = mainM ? mainM[0] : '<main></main>';
  }

  const slug = file.replace('.html', '');

  const content = `---
import Base from '../layouts/Base.astro';
const main = ${JSON.stringify(main)};
---

<Base
  title="${title}"
  description="${desc}"
  canonical="${canon}"
>
  <Fragment set:html={main} />
</Base>
`;

  writeFileSync(`${dst}/${slug}.astro`, content, 'utf-8');
  count++;
}

// guides
const guidesHtml = readFileSync(`${src}/guides/index.html`, 'utf-8');
const gtitleM = guidesHtml.match(/<title>(.*?)<\/title>/);
const gdescM = guidesHtml.match(/<meta name="description" content="(.*?)"/);
const gcanonM = guidesHtml.match(/<link rel="canonical" href="(.*?)"/);
const gstart = guidesHtml.indexOf('</header>') + 9;
const gend = guidesHtml.indexOf('<footer');
const gmain = guidesHtml.slice(gstart, gend).trim();

const guidesContent = `---
import Base from '../../layouts/Base.astro';
const main = ${JSON.stringify(gmain)};
---

<Base
  title="${(gtitleM ? gtitleM[1] : '').replace(/"/g, '&quot;')}"
  description="${(gdescM ? gdescM[1] : '').replace(/"/g, '&quot;')}"
  canonical="${gcanonM ? gcanonM[1] : ''}"
>
  <Fragment set:html={main} />
</Base>
`;

writeFileSync(`${dst}/guides/index.astro`, guidesContent, 'utf-8');

console.log(`Done! ${count + 1} pages created.`);
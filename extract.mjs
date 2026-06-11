import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync('../healthybmicheck/guides/index.html', 'utf-8');

const titleM = html.match(/<title>(.*?)<\/title>/);
const descM = html.match(/<meta name="description" content="(.*?)"/);
const canonM = html.match(/<link rel="canonical" href="(.*?)"/);
const mainM = html.match(/<main[\s\S]*?<\/main>/);

const title = titleM ? titleM[1] : '';
const desc = descM ? descM[1] : '';
const canon = canonM ? canonM[1] : '';
const main = mainM ? mainM[0] : '<main></main>';

const content = `---
import Base from '../../layouts/Base.astro';
---

<Base
  title="${title}"
  description="${desc}"
  canonical="${canon}"
>

${main}

</Base>
`;

writeFileSync('src/pages/guides/index.astro', content, 'utf-8');
console.log('Done: guides/index.astro');
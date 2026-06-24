# Image Optimization Guide

Astro's built-in `<Image>` component (via `astro:assets`) automatically:
- Converts images to **WebP** format
- Adds **lazy loading** (`loading="lazy"`)
- Sets correct `width` and `height` to prevent CLS
- Generates `srcset` for responsive sizes

## How to use

### 1. Local images (recommended)
Place images in `src/assets/images/` (not `public/`):

```astro
---
import { Image } from 'astro:assets';
import myChart from '../assets/images/bmi-chart.png';
---

<Image
  src={myChart}
  alt="BMI chart showing healthy weight ranges by age"
  width={720}
  height={400}
/>
```

### 2. Remote images (e.g. from a CDN)
```astro
---
import { Image } from 'astro:assets';
---

<Image
  src="https://cdn.healthybmicheck.com/bmi-chart.png"
  alt="BMI chart"
  width={720}
  height={400}
  inferSize={true}
/>
```

### 3. OG / social images
Keep `og-image.png` in `public/` as-is — it's referenced directly in `<meta>` tags
and should NOT go through `astro:assets` (needs a stable URL, not a hashed filename).

## When NOT to use `<Image>`
- SVG icons — use `<img>` directly or inline SVG
- `og-image.png` — stays in `public/`
- Images loaded by JavaScript dynamically

## Folder structure
```
src/
  assets/
    images/          ← all page/article images go here
      bmi-chart.png
      calorie-guide.png
public/
  og-image.png       ← OG image only (static URL needed)
  favicon.svg
```

## Alt text tips
- Describe the content of the image, not "image of..."
- Include relevant keywords naturally
- Be specific: "BMI chart for Asian women showing overweight threshold at BMI 23"
  not just "BMI chart"

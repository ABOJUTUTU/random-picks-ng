import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DRAFT_CATEGORIES, DRAFTS_PER_CATEGORY } from '../lib/draft-categories.ts';

// An offline copy of the private draft seed; it never connects to the store.
const destination = resolve(process.argv[2] || 'product-drafts.jsonl');
const lines = [];
for (const category of DRAFT_CATEGORIES) {
  const key = createHash('md5').update(category.toLowerCase()).digest('hex');
  for (let ordinal = 1; ordinal <= DRAFTS_PER_CATEGORY; ordinal++) {
    const suffix = String(ordinal).padStart(5, '0');
    lines.push(JSON.stringify({
      sku: `DRAFT-${key}-${suffix}`, category, name: `${category} draft ${suffix}`,
      description: 'Unverified generated product concept. Replace this placeholder with genuine supplier details and verify all information before approval.',
      price: null, stock: null, colors: [], types: [], images: [], verified: false, status: 'draft',
    }));
  }
}
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, lines.join('\n') + '\n', 'utf8');
process.stdout.write(JSON.stringify({ drafts: lines.length, per_category: DRAFTS_PER_CATEGORY, categories: DRAFT_CATEGORIES, destination }) + '\n');

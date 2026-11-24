import fs from 'fs';
import path from 'path';

// Check all referenced assets in index.html
const indexHtml = fs.readFileSync('index.html', 'utf-8');
console.log('Testing index.html asset integrity:');

// 1. Ensure no development files referenced
if (indexHtml.includes('src/main.tsx')) {
  console.error('FAIL: index.html still references /src/main.tsx!');
  process.exit(1);
} else {
  console.log('PASS: No src/main.tsx reference in index.html');
}

// 2. Extract script tags
const scriptMatches = [...indexHtml.matchAll(/src=["']\.\/(assets\/[^"']+)["']/g)];
for (const match of scriptMatches) {
  const assetPath = match[1];
  if (fs.existsSync(assetPath)) {
    const size = fs.statSync(assetPath).size;
    console.log(`PASS: Script asset exists -> ${assetPath} (${(size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`FAIL: Missing script asset -> ${assetPath}`);
    process.exit(1);
  }
}

// 3. Extract stylesheet tags
const cssMatches = [...indexHtml.matchAll(/href=["']\.\/(assets\/[^"']+)["']/g)];
for (const match of cssMatches) {
  const assetPath = match[1];
  if (fs.existsSync(assetPath)) {
    const size = fs.statSync(assetPath).size;
    console.log(`PASS: CSS asset exists -> ${assetPath} (${(size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`FAIL: Missing CSS asset -> ${assetPath}`);
    process.exit(1);
  }
}

// 4. Verify 404.html parity
const notFoundHtml = fs.readFileSync('404.html', 'utf-8');
if (notFoundHtml !== indexHtml) {
  console.error('FAIL: 404.html does not match index.html');
  process.exit(1);
} else {
  console.log('PASS: 404.html matches index.html (SPA deep-linking supported)');
}

// 5. Verify docs folder parity (for GitHub Pages /docs source)
const docsHtml = fs.readFileSync('docs/index.html', 'utf-8');
if (docsHtml !== indexHtml) {
  console.error('FAIL: docs/index.html does not match index.html');
  process.exit(1);
} else {
  console.log('PASS: docs/index.html matches index.html (GitHub Pages /docs supported)');
}

console.log('\nAll asset and bundle integrity checks passed successfully!');

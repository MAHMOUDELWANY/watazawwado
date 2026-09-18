import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf-8');

// Insert Motion tokens
const motionTokens = `
  /* Motion Tokens */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 350ms;
  --ease-premium: cubic-bezier(0.2, 0.8, 0.2, 1);
`;

if (!content.includes('--duration-fast')) {
  content = content.replace('/* Radius Scale */', motionTokens + '\n  /* Radius Scale */');
  fs.writeFileSync('src/index.css', content);
  console.log('Patched index.css with motion tokens');
}

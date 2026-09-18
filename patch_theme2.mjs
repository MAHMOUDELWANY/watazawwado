import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf-8');

// Insert default transition overrides
const defaultTokens = `
  /* Default Transition Overrides */
  --default-transition-duration: 250ms;
  --default-transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
`;

if (!content.includes('--default-transition-duration')) {
  content = content.replace('/* Motion Tokens */', defaultTokens + '\n  /* Motion Tokens */');
  fs.writeFileSync('src/index.css', content);
  console.log('Patched index.css with default transitions');
}

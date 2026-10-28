/**
 * Build-time only (vite build --ssr): renders a public page to HTML so the first paint shows real
 * content before the JavaScript arrives. scripts/prerender-seo.ts puts the result inside #root;
 * in the browser main.tsx then renders the same page over it.
 */
import React from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import { AppProviders, AppRoutes } from './App';
import { pathLanguage, setPrerenderLanguage } from './lib/language';

export async function render(url: string): Promise<string> {
  // /ar pages render in Arabic, everything else in English (the site default).
  setPrerenderLanguage(pathLanguage(url));
  const { prelude } = await prerenderToNodeStream(
    <AppProviders>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </AppProviders>
  );
  let html = '';
  for await (const chunk of prelude) html += chunk.toString();
  return html;
}

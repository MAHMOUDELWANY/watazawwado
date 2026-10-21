import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import apiRouter from './api/index.js'; // Use .js for TSX/Node resolution

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mount API router
  app.use(apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, fs.existsSync(path.join(distPath, 'spa.html')) ? 'spa.html' : 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  // Node 19+ clients keep connections alive; with the default 5 s server timeout a reused idle socket can be closed
  // mid-request (ECONNRESET). Keep idle sockets longer than clients reuse them; headersTimeout must stay above it.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
}

startServer();

import app from '../api/index.js';
import http from 'http';
const server = http.createServer(app);
server.listen(0, () => {
  console.log(server.address());
  server.close();
});

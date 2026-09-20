const http = require('http');

(async () => {
  try {
    const res = await fetch(`http://127.0.0.1:3000/api/dashboard/availability`, {
        headers: { 'x-dev-teacher-auth': 'true' }
    });
    const text = await res.text();
    console.log(res.status, text);
  } catch(e) {
    console.error(e);
  }
})();

const http = require('http');
const net = require('net');

function toCP1251(s) {
  const b = [];
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 128) b.push(c);
    else if (c >= 0x0410 && c <= 0x044F) b.push(c - 0x0410 + 192);
    else if (c === 0x0401) b.push(168);
    else if (c === 0x0451) b.push(184);
    else if (c === 0x2116) b.push(185);
    else b.push(32);
  }
  return Buffer.from(b);
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

  let body = '';
  req.on('data', ch => body += ch);
  req.on('end', () => {
    if (req.url.includes('print') && req.method === 'POST') {
      const d = JSON.parse(body || '{}');
      const ip = d.ip || '192.168.1.17';
      const sock = new net.Socket();
      sock.setTimeout(2500);
      sock.connect(9100, ip, () => {
        sock.write(toCP1251((d.tspl || '') + '\r\n'), () => {
          sock.destroy();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', msg: 'Напечатано на ' + ip + ':9100 (CP1251)' }));
        });
      });
      sock.on('error', e => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'sim', msg: 'Принтер ' + ip + ' вне сети (' + e.message + ')' }));
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mode: 'Local VS Code Bridge :3001' }));
  });
}).listen(3001, () => console.log('🟢 Local TSC TE310 Bridge on http://localhost:3001'));

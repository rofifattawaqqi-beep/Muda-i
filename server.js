// Server absensi DPS (tanpa instalasi tambahan). Jalankan:  node server.js
// Semua HP / laptop dalam satu Wi-Fi bisa membuka alamat yang tampil di terminal, dan datanya dipakai bersama.
// Data tersimpan di file data.json (di folder yang sama).
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const PORT = process.env.PORT || 3000, DIR = __dirname;
// Lokasi data. Di hosting, arahkan DATA_DIR ke penyimpanan permanen (disk/volume), mis. /var/data
const DATADIR = process.env.DATA_DIR || DIR;
fs.mkdirSync(DATADIR, { recursive: true });
const DBFILE = path.join(DATADIR, 'data.json');
// Password pengurus disimpan sebagai hash SHA-256 (bukan teks). Bisa diganti lewat ADMIN_PASSWORD atau ADMIN_PASSWORD_HASH.
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || (process.env.ADMIN_PASSWORD ? sha(process.env.ADMIN_PASSWORD.trim().toLowerCase()) : '663586732721eb465d89a55b2112214db887b949536869f933308251d3e89ae7');
const MN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function names() {
  const s = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  return JSON.parse(s.match(/const NAMES=(\[[\s\S]*?\]);/)[1]);
}
const mkSessions = () => Array.from({ length: 14 }, (_, i) => ({ id: i + 1, title: 'Pertemuan ' + (i + 1), status: i === 0 ? 'open' : 'upcoming' }));
let db = null;
try { db = JSON.parse(fs.readFileSync(DBFILE, 'utf8')); } catch (e) {}
if (!db || !Array.isArray(db.jamaahList)) {
  db = { jamaahList: names().map((n, i) => ({ id: 'J' + String(i + 1).padStart(3, '0'), name: n, phone: '-', parentId: 'P' + String(i + 1).padStart(3, '0'), parentName: 'Wali ' + n })), periods: {} };
}
if (!db.periods) db.periods = {};
if (!db.secret) db.secret = crypto.randomBytes(32).toString('hex');
const save = () => { db.rev = (db.rev || 0) + 1; fs.writeFileSync(DBFILE, JSON.stringify(db)); };
save();
function period(y, m) {
  const k = y + '_' + m;
  if (!db.periods[k]) { db.periods[k] = { year: y, month: m, sessions: mkSessions(), attendance: {} }; save(); }
  return db.periods[k];
}
function yearly(y) {
  return MN.map((n, i) => {
    const p = db.periods[y + '_' + (i + 1)];
    if (!p) return { month: i + 1, monthName: n, totalHadir: 0, percentage: 0, hasData: false };
    const ps = p.sessions.filter(s => s.status !== 'upcoming');
    let h = 0; Object.values(p.attendance).forEach(r => { if (r.status === 'Hadir') h++; });
    const sl = ps.length * db.jamaahList.length;
    return { month: i + 1, monthName: n, totalHadir: h, percentage: sl ? Math.round(h / sl * 100) : 0, hasData: ps.length > 0 && Object.keys(p.attendance).length > 0 };
  });
}
const readBody = req => new Promise(r => {
  let d = ''; req.on('data', c => { d += c; if (d.length > 1e6) req.destroy(); });
  req.on('end', () => { try { r(JSON.parse(d || '{}')); } catch (e) { r({}); } });
});
const adminToken = () => crypto.createHmac('sha256', db.secret).update('admin').digest('hex');
const isAdmin = req => { const t = String(req.headers['x-admin-token'] || ''), a = adminToken(); return t.length === a.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(a)); };
const tries = {}, regs = {};
const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(obj)); };
const num = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };

const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#1d4ed8"/><path d="M150 270l70 70 150-170" fill="none" stroke="#fff" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const MANIFEST = { name: 'Absensi Muda/i DPS Community', short_name: 'Absensi DPS', start_url: '/', display: 'standalone', background_color: '#070c18', theme_color: '#070c18',
  icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), p = u.pathname;
  try {
    if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      return res.end(fs.readFileSync(path.join(DIR, 'index.html')));
    }
    if (p === '/manifest.json') { res.writeHead(200, { 'Content-Type': 'application/manifest+json' }); return res.end(JSON.stringify(MANIFEST)); }
    if (p === '/icon.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end(ICON); }

    if (p === '/healthz') { res.writeHead(200); return res.end('ok'); }
    if (req.method === 'GET' && p === '/api/export') {
      if (!isAdmin(req)) return send(res, 401, { success: false, message: 'Hanya pengurus' });
      const out = Object.assign({}, db); delete out.secret; delete out.rev;
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="backup-absensi-dps.json"' });
      return res.end(JSON.stringify(out));
    }
    if (req.method === 'GET' && p === '/api/data') {
      if (!isAdmin(req)) return send(res, 401, { success: false, message: 'Login pengurus diperlukan' });
      const y = num(u.searchParams.get('year'), new Date().getFullYear()), m = num(u.searchParams.get('month'), new Date().getMonth() + 1);
      const per = period(y, m);
      if (u.searchParams.get('rev') === String(db.rev)) return send(res, 200, { success: true, unchanged: true, rev: db.rev });
      return send(res, 200, { success: true, rev: db.rev, data: { jamaahList: db.jamaahList, sessions: per.sessions, attendance: per.attendance }, stats: { yearlyMonthsOverview: yearly(y) } });
    }
    if (req.method === 'POST' && p.startsWith('/api/')) {
      const b = await readBody(req);
      if (p === '/api/login') {
        const ip = ipOf(req), now = Date.now(), t = tries[ip] || { n: 0, at: now };
        if (now - t.at > 60000) { t.n = 0; t.at = now; }
        if (t.n >= 6) return send(res, 429, { success: false, message: 'Terlalu banyak percobaan. Coba lagi 1 menit lagi.' });
        t.n++; tries[ip] = t;
        if (sha(String(b.password || '').trim().toLowerCase()) !== ADMIN_HASH) return send(res, 401, { success: false, message: 'Password salah!' });
        delete tries[ip];
        return send(res, 200, { success: true, token: adminToken() });
      }
      if (p === '/api/daftar') {   // pendaftaran mandiri Jamaah Baru (tanpa login, dibatasi)
        const ip = ipOf(req), now = Date.now(), t = regs[ip] || { n: 0, at: now };
        if (now - t.at > 600000) { t.n = 0; t.at = now; }
        if (t.n >= 5) return send(res, 429, { success: false, message: 'Terlalu banyak pendaftaran dari perangkat ini. Coba lagi beberapa menit lagi.' });
        const clean = (v, n) => String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
        const name = clean(b.name, 60);
        if (name.length < 2) return send(res, 400, { success: false, message: 'Nama wajib diisi (minimal 2 huruf)' });
        if (db.jamaahList.length >= 2000) return send(res, 400, { success: false, message: 'Pendaftaran ditutup sementara. Hubungi pengurus.' });
        if (db.jamaahList.some(j => j.name.toLowerCase() === name.toLowerCase())) return send(res, 409, { success: false, message: 'Nama "' + name + '" sudah terdaftar. Hubungi pengurus bila itu bukan Anda.' });
        t.n++; regs[ip] = t;
        const n = db.jamaahList.reduce((a, j) => Math.max(a, parseInt(String(j.id).slice(1), 10) || 0), 0) + 1;
        const j = { id: 'J' + String(n).padStart(3, '0'), name, phone: clean(b.phone, 20) || '-', parentId: 'P' + String(n).padStart(3, '0'), parentName: clean(b.parentName, 60) || 'Wali ' + name, baru: true, daftar: new Date().toISOString() };
        db.jamaahList.push(j); save();
        return send(res, 200, { success: true, name, message: 'Pendaftaran berhasil' });
      }
      if (!isAdmin(req)) return send(res, 401, { success: false, message: 'Sesi pengurus tidak valid. Silakan login ulang.' });
      const y = num(b.year, new Date().getFullYear()), m = num(b.month, new Date().getMonth() + 1), sid = num(b.sessionId, 0);
      if (p === '/api/jamaah') {
        const name = String(b.name || '').trim();
        if (!name) return send(res, 400, { success: false, message: 'Nama wajib diisi' });
        if (db.jamaahList.some(j => j.name.toLowerCase() === name.toLowerCase())) return send(res, 409, { success: false, message: 'Nama sudah terdaftar' });
        const n = db.jamaahList.reduce((a, j) => Math.max(a, parseInt(String(j.id).slice(1), 10) || 0), 0) + 1;
        const j = { id: 'J' + String(n).padStart(3, '0'), name, phone: String(b.phone || '-'), parentId: 'P' + String(n).padStart(3, '0'), parentName: String(b.parentName || '').trim() || 'Wali ' + name };
        db.jamaahList.push(j); save();
        return send(res, 200, { success: true, jamaah: j });
      }
      const per = period(y, m), s = per.sessions.find(x => x.id === sid);
      if (!s) return send(res, 404, { success: false, message: 'Pertemuan tidak ditemukan' });
      if (p === '/api/open-meeting') { s.status = 'open'; save(); return send(res, 200, { success: true, message: s.title + ' sekarang DIBUKA! Jamaah sudah bisa absen.' }); }
      if (p === '/api/close-meeting') {
        s.status = 'closed'; let c = 0;
        db.jamaahList.forEach(j => { const k = s.id + '_' + j.id; if (!per.attendance[k]) { per.attendance[k] = { sessionId: s.id, jamaahId: j.id, status: 'Alfa', timestamp: new Date().toISOString(), note: 'Otomatis Alfa', filledBy: 'system' }; c++; } });
        save(); return send(res, 200, { success: true, message: s.title + ' ditutup! ' + c + ' jamaah otomatis ALFA.' });
      }
      if (p === '/api/absen') {
        if (s.status === 'upcoming') return send(res, 400, { success: false, message: 'Pertemuan belum dibuka' });
        if (!db.jamaahList.some(j => j.id === b.jamaahId)) return send(res, 404, { success: false, message: 'Jamaah tidak ditemukan' });
        const key = s.id + '_' + b.jamaahId;
        if (b.status === 'Hapus') { delete per.attendance[key]; save(); return send(res, 200, { success: true, rev: db.rev, message: 'Status dihapus' }); }
        if (!['Hadir', 'Izin', 'Alfa'].includes(b.status)) return send(res, 400, { success: false, message: 'Status tidak valid' });
        per.attendance[key] = { sessionId: s.id, jamaahId: b.jamaahId, status: b.status, timestamp: new Date().toISOString(), note: String(b.note || ''), filledBy: String(b.filledBy || '') };
        save(); return send(res, 200, { success: true, rev: db.rev, message: 'Absensi ' + b.status + ' tercatat' });
      }
    }
    res.writeHead(404); res.end('Not found');
  } catch (e) { console.error(e); send(res, 500, { success: false, message: 'Kesalahan server' }); }
}).listen(PORT, '0.0.0.0', () => {
  console.log('\nServer absensi berjalan.\n  Di komputer ini : http://localhost:' + PORT);
  Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal)
    .forEach(i => console.log('  Di HP (satu Wi-Fi): http://' + i.address + ':' + PORT));
  console.log('\nTekan Ctrl+C untuk menghentikan.\n');
});

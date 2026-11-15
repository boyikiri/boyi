import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

const CWD = process.cwd();
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9441;
const W = parseInt(process.env.W || '1000', 10);
const H = parseInt(process.env.H || '760', 10);
const PAGE = process.env.PAGE || 'wingame.html';
const OUT = process.env.OUT || 'game';
const EVAL = process.env.EVAL || '';
const WAIT = parseInt(process.env.WAIT || '2500', 10);

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-'));
const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--mute-audio',
  '--user-data-dir=' + profile, '--remote-debugging-port=' + PORT,
  `--window-size=${W},${H}`, 'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function getJson(p) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}

(async () => {
  let wsUrl = null;
  for (let i = 0; i < 90; i++) {
    try {
      const l = await getJson('/json/list');
      const p = (l || []).find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
    } catch (e) {}
    await sleep(150);
  }
  if (!wsUrl) { console.error('no target'); process.exit(1); }

  const ws = new WebSocket(wsUrl);
  let id = 0; const pending = new Map(); const logs = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.consoleAPICalled') logs.push('LOG ' + (m.params.args || []).map(a => a.value || a.description || '').join(' '));
    if (m.method === 'Runtime.exceptionThrown') logs.push('ERR ' + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || m.params.exceptionDetails.text));
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  await new Promise(r => ws.addEventListener('open', r));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'file:///' + CWD.replace(/\\/g, '/') + '/' + PAGE });
  await sleep(WAIT);

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) return 'EXC ' + JSON.stringify(r.result.exceptionDetails.text);
    return r.result && r.result.result ? r.result.result.value : undefined;
  };

  if (EVAL) console.log(JSON.stringify(await evalJs(EVAL)));
  if (logs.length) console.log(logs.join('\n'));

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(CWD, '_shot_' + OUT + '.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('saved', OUT);
  ws.close(); child.kill(); process.exit(0);
})();

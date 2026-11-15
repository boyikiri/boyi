import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
const CWD = process.cwd();
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9467;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-'));
const child = spawn(EDGE, ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--hide-scrollbars','--mute-audio','--user-data-dir='+profile,'--remote-debugging-port='+PORT,'--window-size=1000,800','about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function getJson(p){return new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
(async()=>{
  let wsUrl=null;
  for(let i=0;i<90;i++){try{const l=await getJson('/json/list');const p=(l||[]).find(t=>t.type==='page'&&t.webSocketDebuggerUrl);if(p){wsUrl=p.webSocketDebuggerUrl;break}}catch(e){}await sleep(150)}
  if(!wsUrl){console.error('no target');process.exit(1)}
  const ws=new WebSocket(wsUrl); let id=0; const pending=new Map(); const errs=[];
  ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);
    if(m.method==='Runtime.exceptionThrown') errs.push('ERR '+(m.params.exceptionDetails.exception&&m.params.exceptionDetails.exception.description||m.params.exceptionDetails.text));
    if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
  await new Promise(r=>ws.addEventListener('open',r));
  const send=(method,params={})=>new Promise(res=>{const i=++id;pending.set(i,res);ws.send(JSON.stringify({id:i,method,params}))});
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate',{url:'file:///'+CWD.split(path.sep).join('/')+'/wingame.html'});
  await sleep(2500);
  const ev=async(expr)=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'EXC '+JSON.stringify(r.result.exceptionDetails.exception&&r.result.exceptionDetails.exception.description||r.result.exceptionDetails.text);
    return r.result&&r.result.result?r.result.result.value:undefined};

  const out = await ev(`(function(){
     document.getElementById('btnPomo').click();
     __wg.pomo.mode='work'; __wg.pomo.left=1500; __wg.pomo.run=false;
     document.getElementById('pRun').click();
     var arc=document.getElementById('pArc');
     var t0=arc?arc.style.strokeDashoffset:'no-arc', s0=document.querySelector('#pbody .pp').textContent;
     return new Promise(function(r){ setTimeout(function(){
       var a=document.getElementById('pArc');
       r({arcStart:t0, arcNow:a?a.style.strokeDashoffset:'gone', txtStart:s0,
          txtNow:document.querySelector('#pbody .pp').textContent,
          dial:!!document.querySelector('.pdial')});
     }, 2200) }) })()`);
  console.log(JSON.stringify(out,null,1));
  if(errs.length) console.log(errs.join('\n')); else console.log('no js errors');
  ws.close();child.kill();process.exit(0);
})();

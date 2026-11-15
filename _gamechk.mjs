import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
const CWD = process.cwd();
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9461;
const PAGE = process.env.PAGE || 'wingame.html';
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
  await send('Page.navigate',{url:'file:///'+CWD.split(path.sep).join('/')+'/'+PAGE});
  await sleep(2500);
  const ev=async(expr)=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'EXC '+JSON.stringify(r.result.exceptionDetails.exception&&r.result.exceptionDetails.exception.description||r.result.exceptionDetails.text);
    return r.result&&r.result.result?r.result.result.value:undefined};

  const out = {};
  // 1) 番茄钟跑完一段是否计入今日
  out.pomo = await ev(`(function(){ __wg.pomo.left=0.8; __wg.pomo.run=true; document.getElementById('btnPomo').click(); return new Promise(function(r){ setTimeout(function(){ r({min:__wg.pomo.min,n:__wg.pomo.n,mode:__wg.pomo.mode,left:Math.round(__wg.pomo.left)}) },1600) }) })()`);
  // 2) 备忘自动保存
  out.memo = await ev(`(function(){ document.getElementById('panel').classList.remove('open'); document.getElementById('btnMemo').click();
     var t=document.getElementById('memoBox'); t.value='测试一句话'; t.dispatchEvent(new Event('input'));
     return new Promise(function(r){ setTimeout(function(){ r({stored:localStorage.getItem('wingame.memo.v1'), hint:document.getElementById('memoSt').textContent}) },800) }) })()`);
  // 3) 点鸟不飞走
  out.bird = await ev(`(function(){
     __wg.spawn();
     return new Promise(function(r){
       setTimeout(function(){
         var b2=null; for(var j=0;j<__wg.birds.length;j++) if(__wg.birds[j].phase==='perch') b2=__wg.birds[j];
         if(!b2){ r('no-bird'); return; }
         var cv=document.getElementById('cv'), r0=cv.getBoundingClientRect();
         var before=Math.round(b2.stay-b2.t);
         cv.dispatchEvent(new MouseEvent('click',{clientX:r0.left+(b2.x/320)*r0.width, clientY:r0.top+((150-10)/180)*r0.height, bubbles:true}));
         setTimeout(function(){
           r({phase:b2.phase, act:b2.act, stayLeftAfter:Math.round(b2.stay-b2.t), stayLeftBefore:before});
         }, 600);
       }, 1700);
     });
   })()`);
  // 4) 图鉴/商店仍正常
  out.panels = await ev(`(function(){ document.getElementById('btnShop').click(); var a=document.querySelectorAll('#pbody .row').length;
     document.getElementById('btnColl').click(); var b=document.querySelectorAll('#pbody .ci').length;
     document.getElementById('pclose').click(); return {shopRows:a, collCells:b}; })()`);

  console.log(JSON.stringify(out,null,1));
  if(errs.length) console.log(errs.join('\n')); else console.log('no js errors');
  ws.close();child.kill();process.exit(0);
})();


/* =========================================================
   《窗台羽语 · 上海清晨》 —— 320×180 像素放置 Demo
   全部美术由 Canvas 逐像素绘制，无外部图片与字体素材。
   数值取自设计文档：鸟 10 种 / 花 8 种 / 10 级 / P 为统一点数。
   ========================================================= */
(function () {
  'use strict';

  var CV = document.getElementById('cv');
  var ctx = CV.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  var W = 320, H = 180;
  var SILL = 152;             // 台面前缘：鸟的落脚线
  var POT_BASE = 149;         // 花盆坐在台面靠前处
  var POT_X = [48, 96, 144];  // 花盆中心（围成靠窗的一丛）
  var POT_W = 36, POT_H = 30;
  var POT_TOP = POT_BASE - POT_H;
  var PERCH = [72, 120, 172, 202, 232];

  /* ---------- 数据 ---------- */
  var BIRDS = [
    { id:'sparrow',  name:'麻雀',     lv:1, w:35,  stay:8,  n:1, pts:1,  body:'#8b6b46', wing:'#6d5236', belly:'#e8dcc2', head:'#7a5c3c', beak:'#3a3226' },
    { id:'bulbul',   name:'白头鹎',   lv:1, w:25,  stay:10, n:1, pts:2,  body:'#8d9282', wing:'#6f7d6c', belly:'#f4f0e2', head:'#2b3229', beak:'#4a3a2a', nape:1 },
    { id:'dove',     name:'珠颈斑鸠', lv:2, w:15,  stay:12, n:2, pts:2,  body:'#b0878e', wing:'#8b6a62', belly:'#e9d5c9', head:'#b9bec5', beak:'#3d3531', big:1 },
    { id:'blackbird',name:'乌鸫',     lv:3, w:10,  stay:9,  n:1, pts:4,  body:'#2c2b28', wing:'#1d1d1b', belly:'#33322e', head:'#2c2b28', beak:'#e0a63c' },
    { id:'magpie',   name:'喜鹊',     lv:4, w:6,   stay:7,  n:1, pts:6,  body:'#f2eee0', wing:'#25301c', belly:'#f2eee0', head:'#25301c', beak:'#25301c', tail:1 },
    { id:'azure',    name:'灰喜鹊',   lv:5, w:4,   stay:8,  n:1, pts:5,  body:'#cfd8cf', wing:'#5f9b96', belly:'#e8ece2', head:'#25301c', beak:'#25301c', tail:1 },
    { id:'wagtail',  name:'白鹡鸰',   lv:6, w:3,   stay:6,  n:1, pts:4,  body:'#e8e6d8', wing:'#9aa39c', belly:'#f6f3e6', head:'#6c7570', beak:'#3a3226' },
    { id:'hoopoe',   name:'戴胜',     lv:7, w:1.2, stay:10, n:1, pts:8,  body:'#d9a06a', wing:'#f0d9b5', belly:'#e8c39a', head:'#d9a06a', beak:'#4a3a2a', crest:1 },
    { id:'redstart', name:'北红尾鸲', lv:8, w:0.5, stay:9,  n:1, pts:7,  body:'#c25a3a', wing:'#4a3f36', belly:'#e0a06a', head:'#4a3f36', beak:'#25301c' },
    { id:'shrike',   name:'棕背伯劳', lv:9, w:0.3, stay:8,  n:1, pts:10, body:'#9aa39c', wing:'#6f7a72', belly:'#d9d6c6', head:'#6f7a72', beak:'#25301c', mask:1 }
  ];

  var FLOWERS = [
    { id:'sun',      name:'太阳花', lv:1, price:0,   grow:60,  cool:30,  y:6,  c:'#e8b13c' },
    { id:'pansy',    name:'三色堇', lv:1, price:20,  grow:70,  cool:35,  y:8,  c:'#8a5f9b' },
    { id:'jasmine',  name:'茉莉',   lv:2, price:45,  grow:90,  cool:45,  y:14, c:'#f4f1e2' },
    { id:'mint',     name:'薄荷',   lv:3, price:80,  grow:75,  cool:30,  y:10, c:'#bfdcc0' },
    { id:'petunia',  name:'矮牵牛', lv:4, price:160, grow:110, cool:55,  y:22, c:'#c76a92' },
    { id:'rose',     name:'月季',   lv:5, price:300, grow:140, cool:70,  y:32, c:'#c2453f' },
    { id:'gardenia', name:'栀子',   lv:6, price:550, grow:170, cool:85,  y:45, c:'#f2efe0' },
    { id:'succulent',name:'多肉',   lv:7, price:900, grow:220, cool:110, y:70, c:'#8fae86' }
  ];

  var SHOP = [
    { id:'feed',  name:'普通鸟食', price:10, lv:1, desc:'45 秒内鸟到访间隔 ×0.75' },
    { id:'berry', name:'浆果鸟食', price:20, lv:2, desc:'60 秒内白头鹎 / 乌鸫权重 ×3' },
    { id:'worm',  name:'虫干',     price:25, lv:6, desc:'60 秒内白鹡鸰 / 戴胜权重 ×3' },
    { id:'fert',  name:'普通肥料', price:15, lv:1, desc:'当前花盆剩余生长 / 冷却时间 −50%' },
    { id:'pro',   name:'高级肥料', price:45, lv:4, desc:'60 秒内所有花盆生长速度 ×2' }
  ];

  var LVCOST = [60, 150, 320, 650, 1200, 2200, 4000, 7000, 12000];

  /* ---------- 存档 ---------- */
  var KEY = 'wingame.save.v1';
  var st = {
    p: 0, lv: 1,
    pots: [],
    seeds: ['sun'],
    sel: 'sun',
    coll: { birds: {}, flowers: {} },
    buff: { feed: 0, berry: 0, worm: 0, pro: 0 },
    rate: 0.1, last: Date.now(), fast: true, sound: true,
    bonus10: false, played: 0
  };

  function newPot() { return { seed: null, phase: 'empty', t: 0 }; }
  for (var i = 0; i < 3; i++) st.pots.push(newPot());

  function save() {
    st.last = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (!o || typeof o.p !== 'number') return false;
      for (var k in st) if (o[k] !== undefined) st[k] = o[k];
      if (!Array.isArray(st.pots) || st.pots.length !== 3) st.pots = [newPot(), newPot(), newPot()];
      if (!st.coll || !st.coll.birds) st.coll = { birds: {}, flowers: {} };
      if (!st.buff) st.buff = { feed:0, berry:0, worm:0, pro:0 };
      return true;
    } catch (e) { return false; }
  }

  /* ---------- 小工具 ---------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function qz(p0, p1, p2, t) { var u = 1 - t; return u * u * p0 + 2 * u * t * p1 + t * t * p2; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function flowerOf(id) { for (var i = 0; i < FLOWERS.length; i++) if (FLOWERS[i].id === id) return FLOWERS[i]; return FLOWERS[0]; }
  function gainMul() { return st.lv >= 10 ? 1.2 : 1; }
  function featherPts(spec) { return Math.round(spec.pts * (1 + 0.08 * (st.lv - 1)) * gainMul()); }
  function harvestPts(f) { return Math.round(f.y * (1 + 0.06 * (st.lv - 1)) * gainMul()); }
  function interval() {
    var t = Math.max(8, 22 * Math.pow(0.95, st.lv - 1));
    if (st.buff.feed > 0) t *= 0.75;
    return t;
  }
  function activePots() { return st.lv >= 4 ? 3 : 2; }

  /* ---------- 提示 ---------- */
  var toastEl = document.getElementById('toast'), toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 1900);
  }

  /* ---------- 音效（WebAudio，无外部文件） ---------- */
  var AC = null, sndOn = st.sound;
  function blip(freq, dur, type, vol) {
    if (!sndOn) return;
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = 0;
      o.connect(g); g.connect(AC.destination);
      var t = AC.currentTime;
      g.gain.linearRampToValueAtTime(vol || 0.05, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.16));
      o.start(t); o.stop(t + (dur || 0.16) + 0.02);
    } catch (e) {}
  }

  /* ---------- 世界状态 ---------- */
  var birds = [], feathers = [], fx = [];
  var nextAt = 0, tNow = 0;      // tNow 为游戏内累计秒
  var hover = { feather: -1, pot: -1 };

  /* ---------- 场景常量 ---------- */
  var C = {
    sky1:'#8dbfd9', sky2:'#a8cfe2', sky3:'#c6e0ea', sky4:'#e0eff2',
    hill1:'#bccfd2', hill1L:'#d3e0e2', hill2:'#7fa286', hill2L:'#9ab997',
    wall:'#e2dbc6', wallD:'#c6bb9f', roof:'#64757c', roofL:'#84939a', win:'#3b4740',
    leaf1:'#2c5531', leaf2:'#46803c', leaf3:'#69a84a', leaf4:'#9ac76a',
    bark:'#6d5941', barkL:'rgba(170,138,102,.5)', barkD:'rgba(46,36,24,.35)',
    moss:'#4d7f3c', mossL:'#6ba14c',
    sun:'#f7d98d', sun2:'#f2c96f',
    wood:'#6f4a2e', woodL:'#8a5f3a', woodH:'#c79361', woodD:'#4a301c', woodDD:'#33210f',
    pot:'#c0794f', potL:'#d99b6e', potD:'#8e5535', soil:'#5a4632',
    stem:'#4f7a46', leaf:'#6d9a5b', ink:'#25301c', cream:'#fbf7ea'
  };

  var FAR = [
    [4,26,14],[26,18,20],[44,30,11],[60,14,24],[78,22,17],[98,10,28],
    [114,20,15],[138,26,19],[162,12,26],[180,22,13],[202,16,23],
    [222,28,11],[242,14,21],[260,24,15],[288,18,19]
  ];

  /* ---------- 3×5 像素字（仅数字与少量符号） ---------- */
  var GLYPH = {
    '0':[7,5,5,5,7], '1':[2,6,2,2,7], '2':[7,1,7,4,7], '3':[7,1,7,1,7],
    '4':[5,5,7,1,1], '5':[7,4,7,1,7], '6':[7,4,7,5,7], '7':[7,1,1,1,1],
    '8':[7,5,7,5,7], '9':[7,5,7,1,7],
    '+':[0,2,7,2,0], '-':[0,0,7,0,0], '.':[0,0,0,0,2], ':':[0,2,0,2,0],
    'P':[7,5,7,4,4], 's':[7,4,7,1,7], 'x':[5,5,2,5,5], '%':[5,1,2,4,5]
  };
  function pxText(str, x, y, color, sc) {
    sc = sc || 1;
    ctx.fillStyle = color;
    var cx = x;
    for (var i = 0; i < str.length; i++) {
      var g = GLYPH[str[i]];
      if (!g) { cx += 4 * sc; continue; }
      for (var r = 0; r < 5; r++) {
        var bits = g[r];
        for (var c = 0; c < 3; c++) {
          if (bits & (4 >> c)) ctx.fillRect(cx + c * sc, y + r * sc, sc, sc);
        }
      }
      cx += 4 * sc;
    }
  }

  /* ---------- 绘制：背景 ---------- */
  function px(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

  function dither(y0, y1, colA) {
    ctx.fillStyle = colA;
    for (var y = y0; y < y1; y++) {
      for (var x = (y % 2); x < W; x += 2) ctx.fillRect(x, y, 1, 1);
    }
  }

  /* ---------- 窗外：夏天的大树、远山与村舍 ---------- */
  /* 背景是静的，整张预渲染到离屏画布，每帧只 blit 一次 */
  var BGC = document.createElement('canvas');
  BGC.width = W; BGC.height = H;
  var bg = BGC.getContext('2d');
  var bgDone = false;

  function buildBG() {
    var live = ctx;
    ctx = bg;
    drawSky();
    drawHills();
    drawVillage();
    drawHaze();
    drawBushes();
    buildMask();
    drawTree();
    drawCanopy();
    drawBranches();
    drawDapple();
    ctx = live;
    bgDone = true;
  }

  function nz(i) { var v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); }

  function drawSky() {
    px(0, 0, W, 30, C.sky1);
    px(0, 30, W, 36, C.sky2);
    px(0, 66, W, 34, C.sky3);
    px(0, 100, W, 32, C.sky4);
    dither(28, 30, C.sky2);
    dither(64, 66, C.sky3);
    dither(98, 100, C.sky4);
  }

  /* 远山 + 中景的一带树林 */
  function drawHills() {
    var x, h, i;
    for (x = 0; x < W; x++) {
      h = 6 + Math.round(Math.sin(x * 0.0105 + 2.2) * 3 + Math.sin(x * 0.041) * 1.4);
      px(x, 100 - h, 1, 32, C.hill1);
      px(x, 100 - h, 1, 1, C.hill1L);
    }
    dither(100, 104, 'rgba(255,250,236,.16)');
    for (x = 0; x < W; x++) {
      h = 4 + Math.round(Math.abs(Math.sin(x * 0.17)) * 3 + Math.sin(x * 0.052) * 1.5);
      px(x, 106 - h, 1, 24, C.hill2);
      px(x, 106 - h, 1, 1, C.hill2L);
    }
    /* 林子里几棵高一点的树冠 */
    var CR = [[16, 105, 7], [40, 103, 6], [96, 105, 6], [154, 104, 7],
              [176, 106, 5], [232, 105, 7], [286, 105, 6]];
    for (i = 0; i < CR.length; i++) {
      disc(CR[i][0], CR[i][1], CR[i][2], C.hill2);
      disc(CR[i][0], CR[i][1] - 1, CR[i][2] - 2, C.hill2L);
    }
  }

  /* 山脚下的一排村舍：只露瓦顶与半截白墙 */
  function house(x, y, w, wall) {
    var i, t, ww, hw = 128 - y;
    px(x, y, w, hw, wall);
    px(x, y, 1, hw, 'rgba(255,255,255,.4)');
    px(x + w - 1, y, 1, hw, C.wallD);
    px(x + w - 3, y, 2, hw, 'rgba(255,255,255,.12)');

    /* 瓦面：上窄下宽，顶上一条亮脊 */
    for (i = 0; i < 7; i++) {
      ww = Math.round(w * 0.45) + Math.round((w * 0.55 + 6) * i / 6);
      px(x + (w - ww) / 2, y - 7 + i, ww, 1, i < 2 ? C.roofL : C.roof);
      for (t = 1; t < ww - 1; t += 3)
        px(x + (w - ww) / 2 + t, y - 7 + i, 1, 1, 'rgba(22,30,34,.18)');
    }
    /* 檐口 */
    px(x - 3, y, w + 6, 1, C.roofL);
    px(x - 3, y + 1, w + 6, 1, 'rgba(36,40,34,.22)');

    /* 门与小窗 */
    if (w >= 14) {
      px(x + 3, y + 3, 2, 2, C.win);
      px(x + w - 5, y + 3, 2, 2, C.win);
      px(x + Math.round(w * 0.45), 120, 2, 4, C.win);
    }
  }

  function drawVillage() {
    house(20, 116, 18, '#e2dbc7');
    house(42, 118, 13, '#dcd4bc');
    house(184, 117, 15, '#e0d9c4');
    house(204, 114, 20, '#e4ddc9');
    house(246, 118, 14, '#ddd5be');
    house(268, 115, 18, '#e1dac5');
  }

  /* 屋前的灌木，把房子下半截掩一掩 */
  function drawBushes() {
    var B = [[8, 124, 7], [30, 125, 5], [166, 125, 6], [236, 124, 6], [262, 125, 5], [300, 124, 6]];
    for (var i = 0; i < B.length; i++) {
      disc(B[i][0], B[i][1], B[i][2], '#6f9668');
      disc(B[i][0], B[i][1] - 1, B[i][2] - 2, '#82a97a');
    }
  }

  /* 一棵长在窗外的树：左边树冠密，往右上收出画面 */
  var CLUSTERS = [
    [4, 22, 26], [36, 10, 26], [72, 18, 28], [108, 8, 26], [144, 16, 26],
    [178, 8, 22], [206, 20, 20], [232, 10, 16],
    [282, 6, 15], [303, 24, 11],
    [12, 42, 18], [48, 36, 20], [84, 44, 20], [120, 36, 20], [156, 42, 20],
    [188, 36, 18], [214, 46, 15],
    [22, 58, 14], [56, 54, 15], [92, 62, 14], [128, 54, 14], [162, 62, 13],
    [194, 56, 12],
    [36, 72, 11], [72, 74, 9], [104, 70, 11]
  ];

  /* 叶团并成一张遮罩，边缘按角度抖一抖，才不会看成一球一球 */
  var CMASK = new Uint8Array(W * 130);

  function inMask(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= 130) return 0;
    return CMASK[y * W + x];
  }

  function buildMask() {
    var i, k, x, y, c, dx, dy, a, ai, a0, a1, at, r, rad, jit;
    for (i = 0; i < CLUSTERS.length; i++) {
      c = CLUSTERS[i];
      rad = [];
      for (k = 0; k < 24; k++) rad[k] = c[2] * (0.86 + nz(i * 7.3 + k) * 0.26);
      var x0 = Math.max(0, Math.floor(c[0] - c[2] * 1.2));
      var x1 = Math.min(W - 1, Math.ceil(c[0] + c[2] * 1.2));
      var y0 = Math.max(0, Math.floor(c[1] - c[2] * 1.2));
      var y1 = Math.min(129, Math.ceil(c[1] + c[2] * 1.2));
      for (y = y0; y <= y1; y++) {
        for (x = x0; x <= x1; x++) {
          dx = x - c[0]; dy = y - c[1];
          a = Math.atan2(dy, dx);
          ai = (a + Math.PI) / (Math.PI * 2) * 24;
          a0 = Math.floor(ai) % 24; a1 = (a0 + 1) % 24; at = ai - Math.floor(ai);
          r = rad[a0] * (1 - at) + rad[a1] * at;
          /* 边缘再抖 1~2px，破掉正圆 */
          jit = (nz(x * 1.31 + y * 2.77) - 0.5) * 3;
          if (dx * dx + dy * dy <= (r + jit) * (r + jit)) CMASK[y * W + x] = 1;
        }
      }
    }
  }

  function drawCanopy() {
    var x, y, n, m, col;
    for (y = 0; y < 130; y++) {
      for (x = 0; x < W; x++) {
        if (!CMASK[y * W + x]) continue;
        col = C.leaf2;
        if (!inMask(x, y - 2)) col = C.leaf4;                     /* 朝上的叶面，被太阳照透 */
        else if (!inMask(x + 3, y - 2)) col = C.leaf3;            /* 偏右侧一层 */
        else if (!inMask(x - 1, y + 2) || !inMask(x, y + 3)) col = C.leaf1;  /* 下缘阴影 */
        else {
          n = nz((x >> 1) * 1.7 + (y >> 1) * 3.1);
          m = nz((x >> 2) * 4.3 + (y >> 2) * 2.7);
          if (n > 0.8 || m > 0.76) col = C.leaf3;
          else if (n < 0.2 || m < 0.24) col = C.leaf1;
        }
        px(x, y, 1, 1, col);
      }
    }
    /* 上亮下暗：越靠下越沉 */
    var d;
    for (y = 44; y < 130; y++) {
      d = (y - 44) / 44;
      if (d > 1) d = 1;
      for (x = 0; x < W; x++) {
        if (!CMASK[y * W + x]) continue;
        if (nz(x * 0.7 + y * 1.9) < d * 0.55) px(x, y, 1, 1, 'rgba(20,46,28,.30)');
      }
    }
    /* 叶隙：几处透光的小洞 */
    var i, hx, hy;
    for (i = 0; i < 7; i++) {
      hx = 30 + Math.round(nz(i * 4.1) * 130);
      hy = 16 + Math.round(nz(i * 6.9) * 48);
      if (inMask(hx, hy) && inMask(hx - 3, hy) && inMask(hx + 3, hy) &&
          inMask(hx, hy - 3) && inMask(hx, hy + 3))
        px(hx, hy, 1, 1, C.sky3);
    }
  }

  /* 树冠里透出来的枝：只画在叶子里，像被叶子挡了一半 */
  function branch(x0, y0, x1, y1, w0, w1) {
    var len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    var n = Math.ceil(len), i, j, k, t, cx, cy, r;
    for (i = 0; i <= n; i++) {
      t = i / n;
      cx = Math.round(x0 + (x1 - x0) * t);
      cy = Math.round(y0 + (y1 - y0) * t);
      r = (w0 + (w1 - w0) * t) / 2;
      for (j = -Math.ceil(r); j <= Math.ceil(r); j++) {
        for (k = -Math.ceil(r); k <= Math.ceil(r); k++) {
          if (j * j + k * k > r * r) continue;
          if (!inMask(cx + k, cy + j)) continue;
          px(cx + k, cy + j, 1, 1, 'rgba(52,40,26,.5)');
        }
      }
    }
  }

  function drawBranches() {
    var B = [
      [86, 92, 62, 66, 5, 2], [62, 68, 44, 42, 2, 1],
      [86, 92, 110, 62, 5, 2], [110, 64, 130, 40, 2, 1],
      [87, 94, 148, 58, 4, 2], [148, 60, 170, 36, 2, 1],
      [100, 70, 86, 44, 3, 1], [196, 50, 212, 30, 2, 1]
    ];
    for (var i = 0; i < B.length; i++)
      branch(B[i][0], B[i][1], B[i][2], B[i][3], B[i][4], B[i][5]);
  }

  /* 远处蒙一层空气，把村舍压到后面去 */
  function drawHaze() {
    var x, y;
    for (y = 88; y < 128; y++) {
      for (x = 0; x < W; x++) {
        if ((x + y) % 2) continue;
        if (nz(x * 0.9 + y * 1.7) < 0.55) px(x, y, 1, 1, 'rgba(205,224,232,.11)');
      }
    }
  }

  /* 光斑：太阳穿过叶子，在树冠上留下的几团亮 */
  var DAPPLE = [[150, 22, 8], [182, 34, 6], [120, 12, 5], [204, 28, 5],
                [96, 30, 4], [162, 48, 4], [64, 18, 4]];

  function drawDapple() {
    var i, d, dx, dy, r, n;
    for (i = 0; i < DAPPLE.length; i++) {
      d = DAPPLE[i];
      r = d[2];
      for (dy = -r; dy <= r; dy++) {
        for (dx = -r; dx <= r; dx++) {
          n = dx * dx + dy * dy;
          if (n > r * r) continue;
          if (!inMask(d[0] + dx, d[1] + dy)) continue;
          if (nz((d[0] + dx) * 2.3 + (d[1] + dy) * 5.1) > (n < (r - 2) * (r - 2) ? 0.55 : 0.85))
            px(d[0] + dx, d[1] + dy, 1, 1, C.leaf4);
        }
      }
    }
  }

  /* 一截从粗到细的枝干 */
  function limb(x0, y0, x1, y1, w0, w1, col) {
    var n = Math.ceil(Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)));
    ctx.fillStyle = col;
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
      var r = (w0 + (w1 - w0) * t) / 2;
      ctx.fillRect(Math.round(cx - r), Math.round(cy - r),
                   Math.max(1, Math.round(r * 2)), Math.max(1, Math.round(r * 2)));
    }
  }

  function drawTree() {
    /* 主干：从台面下长上来，上端钻进树冠里 */
    limb(88, 130, 86, 90, 17, 12, C.bark);
    /* 分叉 */
    limb(86, 94, 56, 70, 8, 5, C.bark);
    limb(56, 72, 38, 52, 5, 3, C.bark);
    limb(86, 94, 118, 72, 8, 5, C.bark);
    limb(118, 74, 142, 56, 5, 3, C.bark);
    limb(87, 96, 100, 66, 7, 4, C.bark);
    limb(100, 68, 110, 48, 4, 2, C.bark);

    /* 受光面 / 背光面 */
    limb(85, 128, 81, 94, 5, 3, C.barkL);
    limb(92, 128, 90, 96, 5, 3, C.barkD);

    /* 树皮的竖纹 */
    for (var i = 0; i < 16; i++) {
      var gy = 92 + Math.round(nz(i * 3.1) * 36);
      var gx = 79 + Math.round(nz(i * 7.7) * 12);
      px(gx, gy, 1, 2 + Math.round(nz(i) * 4), 'rgba(46,36,24,.22)');
    }

    /* 爬在树干上的青苔 */
    var moss = [[82, 120, 4], [90, 114, 3], [80, 106, 3], [91, 100, 3], [84, 94, 3]];
    for (i = 0; i < moss.length; i++) {
      px(moss[i][0], moss[i][1], moss[i][2], 2, C.moss);
      px(moss[i][0], moss[i][1], moss[i][2] - 1, 1, C.mossL);
    }
  }

  /* ---------- 木纹小工具 ---------- */
  function hash(n) { var v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }

  function grainH(x, y, w, col, seed) {
    ctx.fillStyle = col;
    var cx = x, i = 0;
    while (cx < x + w) {
      var len = 2 + Math.floor(hash(seed + i * 1.7) * 7);
      var end = Math.min(cx + len, x + w);
      if (end > cx) ctx.fillRect(cx | 0, y | 0, (end - cx) | 0, 1);
      cx = end + 3 + Math.floor(hash(seed + i * 3.1) * 7);
      i++;
    }
  }

  function grainV(x, y, h, col, seed) {
    ctx.fillStyle = col;
    var cy = y, i = 0;
    while (cy < y + h) {
      var len = 3 + Math.floor(hash(seed + i * 1.9) * 8);
      var end = Math.min(cy + len, y + h);
      if (end > cy) ctx.fillRect(x | 0, cy | 0, 1, (end - cy) | 0);
      cy = end + 3 + Math.floor(hash(seed + i * 2.6) * 8);
      i++;
    }
  }

  /* 木节：同心的小圈 */
  function knot(x, y) {
    px(x, y, 5, 1, 'rgba(74,48,28,.30)');
    px(x + 1, y - 1, 3, 1, 'rgba(74,48,28,.20)');
    px(x + 1, y + 1, 3, 1, 'rgba(74,48,28,.20)');
    px(x + 2, y, 1, 1, 'rgba(38,24,13,.45)');
  }

  /* 长木纹：横贯板面、微微起伏的一条线 */
  function wavy(y, col, amp, seed) {
    ctx.fillStyle = col;
    for (var x = 0; x < W; x++) {
      var yy = y + Math.round(Math.sin(x * 0.045 + seed * 2.3) * amp + Math.sin(x * 0.011 + seed) * 1.1);
      ctx.fillRect(x, yy, 1, 1);
    }
  }

  function drawFrame() {
    /* 竖框：木色 + 竖向木纹 + 内缘受光 */
    function stile(x) {
      px(x, 0, 12, 135, C.wood);
      px(x, 0, 1, 135, C.woodDD);
      px(x + 1, 0, 1, 135, C.woodL);
      px(x + 11, 0, 1, 135, C.woodD);
      px(x + 10, 0, 1, 135, 'rgba(206,166,120,.22)');
      for (var i = 0; i < 13; i++) {
        var gx = x + 3 + Math.floor(hash(i * 2.7 + x) * 6);
        var gy = Math.floor(hash(i * 5.1 + x) * 100);
        grainV(gx, gy, 8 + Math.floor(hash(i * 3.9 + x) * 30), 'rgba(58,38,22,.20)', i + x);
      }
    }
    stile(0); stile(W - 12);

    /* 顶框 */
    px(0, 0, W, 9, C.wood);
    px(0, 0, W, 2, C.woodL);
    px(0, 2, W, 1, 'rgba(206,166,120,.45)');
    px(0, 8, W, 1, C.woodD);
    px(0, 9, W, 1, 'rgba(0,0,0,.30)');
    grainH(0, 4, W, 'rgba(58,38,22,.26)', 5);

    /* 窗扇下框（横档） */
    px(0, 126, W, 9, C.wood);
    px(0, 126, W, 1, '#8a6040');
    px(0, 127, W, 1, C.woodL);
    px(0, 134, W, 1, C.woodD);
    grainH(0, 130, W, 'rgba(58,38,22,.22)', 21);

    /* 左框上的两枚铜合页 */
    function hinge(y) {
      px(11, y, 3, 6, '#a98b52');
      px(11, y, 3, 1, '#c8ab6e');
      px(12, y + 2, 1, 1, '#6f5a30');
      px(12, y + 4, 1, 1, '#6f5a30');
      px(11, y + 6, 3, 1, 'rgba(40,28,14,.35)');
    }
    hinge(30); hinge(70);
  }

  /* 窗台：一条厚木板，台面压得很薄、前缘给足厚度，才有透视 */
  function drawSill() {
    /* 台面主色 */
    px(0, 135, W, 17, '#a5764a');

    /* 后段吃窗框的影，前段受光 */
    px(0, 135, W, 2, 'rgba(30,18,10,.32)');
    dither(136, 139, 'rgba(30,18,10,.10)');
    dither(147, 151, 'rgba(228,180,134,.10)');

    /* 木纹：长而缓的横纹 + 两个木节 */
    wavy(140, 'rgba(54,33,18,.20)', 1, 1.7);
    wavy(143, 'rgba(54,33,18,.14)', 1, 4.1);
    wavy(147, 'rgba(54,33,18,.11)', 1, 0.9);
    wavy(150, 'rgba(54,33,18,.08)', 1, 2.9);
    wavy(145, 'rgba(236,194,148,.10)', 0, 2.4);
    knot(58, 143); knot(228, 148); knot(168, 139);

    /* 两端压暗，别让木板看起来是无限长的一条 */
    for (var e = 0; e < 20; e++) {
      var a = 0.18 * (1 - e / 20);
      px(e, 135, 1, 18, 'rgba(26,15,8,' + a.toFixed(3) + ')');
      px(W - 1 - e, 135, 1, 18, 'rgba(26,15,8,' + a.toFixed(3) + ')');
    }

    /* 与窗框的接缝 */
    px(0, 135, W, 1, 'rgba(24,14,8,.55)');
    px(0, 136, W, 1, 'rgba(212,174,132,.12)');

    /* 前缘的倒角：被天光打亮的一线 */
    px(0, 152, W, 1, '#d0a06f');

    /* 前缘立面：压暗，和台面拉开 */
    px(0, 153, W, 11, '#74502f');
    px(0, 153, W, 1, '#845d38');
    wavy(157, 'rgba(28,16,8,.16)', 0, 3.3);
    wavy(161, 'rgba(28,16,8,.11)', 0, 6.2);
    px(0, 162, W, 3, '#48301a');
    for (var e2 = 0; e2 < 20; e2++) {
      var a2 = 0.20 * (1 - e2 / 20);
      px(e2, 153, 1, 11, 'rgba(20,12,6,' + a2.toFixed(3) + ')');
      px(W - 1 - e2, 153, 1, 11, 'rgba(20,12,6,' + a2.toFixed(3) + ')');
    }

    /* 台下：室内，暗下去，把亮处衬出来 */
    px(0, 164, W, 16, '#4a5044');
    px(0, 164, W, 2, 'rgba(10,12,8,.34)');
    dither(166, 172, 'rgba(10,12,8,.10)');
    px(0, 174, W, 6, '#3d4339');
    dither(171, 174, 'rgba(10,12,8,.08)');
  }

  /* 台面上的水珠（从窗外带进来的雨水/露水） */
  var DROPS = [[22,142],[64,148],[96,145],[112,139],[152,149],[186,141],[214,147],[244,143],[276,138],[300,146]];
  function drawDrops() {
    for (var i = 0; i < DROPS.length; i++) {
      var x = DROPS[i][0], y = DROPS[i][1];
      px(x, y - 1, 1, 1, 'rgba(251,247,234,.55)');
      px(x - 1, y, 3, 1, 'rgba(226,238,236,.75)');
      px(x, y + 1, 1, 1, 'rgba(120,130,110,.35)');
    }
  }

  /* ---------- 台面上的几盆装饰植物：不能种，纯摆设 ---------- */
  function leaf(cx, cy, w, h, c1, c2) {
    for (var dy = 0; dy < h; dy++) {
      var ww = Math.max(1, Math.round(w * Math.sin((dy + 1) / (h + 1) * Math.PI)));
      px(cx - (ww >> 1), cy + dy, ww, 1, c1);
    }
    px(cx, cy + 1, 1, h - 2, c2);
  }

  function blade(x0, y0, h, lean, c1, c2) {
    for (var i = 0; i < h; i++) {
      var t = i / h;
      var x = Math.round(x0 + lean * t * t);
      var w = (t > 0.82 || t < 0.12) ? 1 : 2;
      var c = (i % 5 === 2) ? c2 : c1;
      px(x, y0 - i, w, 1, c);
      if (w > 1) px(x + 1, y0 - i, 1, 1, (i % 5 === 2) ? c1 : c2);
    }
  }

  function drawDecor() {
    /* 左：奶油釉小盆 + 一丛阔叶 */
    var px0 = 21, pb = 149;
    px(px0 - 7, pb - 9, 15, 2, '#f0e8d3');
    px(px0 - 6, pb - 7, 13, 6, '#dbd0b6');
    px(px0 - 6, pb - 7, 1, 6, '#f5efdb');
    px(px0 - 6, pb - 2, 13, 1, '#b6aa8e');
    px(px0 - 8, pb, 17, 1, 'rgba(37,48,28,.20)');
    px(px0 - 5, pb - 9, 11, 1, '#4a3826');

    /* 叶柄 */
    px(px0, pb - 15, 1, 6, '#4f7a46');
    px(px0 - 3, pb - 13, 1, 4, '#48703f');
    px(px0 + 3, pb - 13, 1, 4, '#48703f');

    leaf(px0 - 4, pb - 24, 7, 10, '#4f7a46', '#7aa860');
    leaf(px0 + 2, pb - 22, 7, 9, '#5f8f52', '#8aab5f');
    leaf(px0 - 7, pb - 20, 6, 8, '#48703f', '#6f9e58');
    leaf(px0 + 5, pb - 19, 6, 8, '#5f8f52', '#8aab5f');
    leaf(px0 - 3, pb - 17, 5, 6, '#6f9e58', '#8aab5f');
    leaf(px0 + 1, pb - 16, 5, 6, '#6f9e58', '#8aab5f');

    /* 右：青灰细盆 + 虎尾兰 */
    var sx = 252, sb = 149;
    px(sx - 7, sb - 10, 15, 2, '#c8d2cd');
    px(sx - 6, sb - 8, 13, 7, '#a7b5ae');
    px(sx - 6, sb - 8, 1, 7, '#cbd5cf');
    px(sx - 5, sb - 2, 11, 1, '#7f8f88');
    px(sx - 8, sb, 17, 1, 'rgba(37,48,28,.20)');
    px(sx - 5, sb - 10, 11, 1, '#4a3826');

    blade(sx - 4, sb - 10, 13, -3, '#4f7a46', '#7fa860');
    blade(sx - 1, sb - 10, 20, -1, '#3f6a3a', '#6f9e58');
    blade(sx + 2, sb - 10, 16, 1, '#4f7a46', '#7fa860');
    blade(sx + 4, sb - 10, 11, 3, '#5f8f52', '#8aab5f');
    blade(sx + 5, sb - 10, 8, 4, '#4f7a46', '#7fa860');
  }

  /* ---------- 小台灯：鹦鹉螺罩 + 铜臂 ---------- */
  function arc(cx, cy, r, a0, a1, col) {
    ctx.fillStyle = col;
    for (var a = a0; a < a1; a += 0.055) {
      ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
    }
  }

  function drawLamp(lx, base) {
    var sx = lx + 9, sy = base - 28, r = 8;

    /* 灯口漏出来的暖光（先铺，罩子压在上面） */
    ctx.globalAlpha = 0.12;
    disc(sx + 9, sy + 2, 12, '#ffd68a');
    ctx.globalAlpha = 0.16;
    disc(sx + 9, sy + 2, 7, '#ffd68a');
    ctx.globalAlpha = 1;
    px(sx + 4, base - 1, 26, 2, 'rgba(255,214,138,.09)');

    /* 底座 */
    px(lx - 9, base + 1, 18, 1, 'rgba(37,48,28,.20)');
    px(lx - 8, base - 1, 16, 2, '#4a3018');
    px(lx - 7, base - 3, 14, 2, '#6b4728');
    px(lx - 5, base - 5, 10, 2, '#8a5f36');
    px(lx - 4, base - 5, 8, 1, '#c39a68');

    /* 弯杆：底下直、顶上往右拐 */
    for (var t = 0; t <= 1.001; t += 0.035) {
      var ax = Math.round(lx + 5 * t * t);
      var ay = Math.round(base - 5 - 18 * t);
      px(ax, ay, 2, 1, '#7d5530');
      px(ax, ay - 1, 1, 1, '#c39a68');
    }

    /* 罩子：外圈是描边，壳肉暖白，四道螺旋条 */
    disc(sx, sy, r, '#35241a');
    disc(sx, sy, r - 1, '#f0dcbe');
    arc(sx, sy, r - 2, -2.7, 1.5, '#b9713a');
    arc(sx, sy, r - 4, -2.4, 1.7, '#cf8a4e');
    arc(sx, sy, r - 6, -2.1, 2.0, '#a35c2c');
    px(sx - 2, sy, 2, 2, '#7d4522');

    /* 灯口：一道竖着的发光缺口 */
    px(sx + 4, sy - 4, 2, 9, '#c07b3a');
    px(sx + 5, sy - 3, 2, 7, '#ffdf9e');
    px(sx + 6, sy - 2, 1, 5, '#fff6dc');
    px(sx + 5, sy - 3, 1, 1, '#fffdf0');
    px(sx + 5, sy + 3, 1, 1, '#fffdf0');
  }

  /* 小茶杯（靠右，呼应参考图） */
  function drawCup(cx, base) {
    px(cx - 9, base - 4, 18, 1, '#eae5d4');
    px(cx - 10, base - 3, 20, 2, '#d9d3be');
    px(cx - 8, base - 1, 16, 1, '#b9b39e');
    px(cx - 7, base + 1, 14, 1, 'rgba(37,48,28,.16)');
    /* 杯身 */
    px(cx - 6, base - 11, 12, 1, '#f4f0e2');
    px(cx - 6, base - 10, 11, 8, '#eee9d8');
    px(cx + 4, base - 10, 1, 8, '#d5cfba');
    px(cx - 6, base - 3, 11, 1, '#e2dcc8');
    /* 茶汤 */
    px(cx - 5, base - 10, 10, 2, '#c1894a');
    px(cx - 4, base - 10, 8, 1, '#d8a35c');
    /* 把手 */
    px(cx + 5, base - 8, 2, 1, '#e6e0cc');
    px(cx + 6, base - 7, 1, 3, '#dbd5c0');
    px(cx + 5, base - 4, 2, 1, '#e6e0cc');
  }

  /* 顶框垂下来的两枝藤蔓（呼应参考图里的绿意） */
  function drawVine(x0, len, seed) {
    for (var i = 0; i < len; i++) {
      var x = x0 + Math.round(Math.sin(i * 0.24 + seed) * 3);
      px(x, 9 + i, 1, 1, '#4a6b3e');
      if (i > 2 && i % 7 === 3) {
        px(x - 3, 9 + i, 3, 2, '#5c8050');
        px(x - 2, 9 + i - 1, 2, 1, '#6d9a5b');
      }
      if (i > 4 && i % 9 === 1) {
        px(x + 1, 9 + i, 3, 2, '#4f7a46');
        px(x + 2, 9 + i - 1, 2, 1, '#5f8a54');
      }
    }
  }

  /* 玻璃上的斜光 */
  function drawGlass() {
    for (var i = 0; i < 26; i++) px(26 + i * 2, 14 + i, 5, 1, 'rgba(251,247,234,.055)');
    for (var j = 0; j < 18; j++) px(40 + j * 2, 40 + j, 3, 1, 'rgba(251,247,234,.04)');
    for (var k = 0; k < 20; k++) px(210 + k * 2, 18 + k, 4, 1, 'rgba(251,247,234,.035)');
  }

  /* 远处的两三只飞鸟 */
  function farBirds() {
    var t = Math.floor(tNow * 2) % 2;
    var bx = [140, 152, 236], by = [40, 34, 30], bs = [1, 0.8, 0.7];
    for (var i = 0; i < bx.length; i++) {
      var x = bx[i], y = by[i] + (t ? 0 : 1);
      ctx.fillStyle = 'rgba(37,48,28,.22)';
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1);
      if (bs[i] > 0.9) { ctx.fillRect(x - 2, y - 2, 1, 1); ctx.fillRect(x + 2, y - 2, 1, 1); }
    }
  }

  /* ---------- 花：每种花一张小像素图 ---------- */
  function disc(cx, cy, r, col) {
    ctx.fillStyle = col;
    for (var dy = -r; dy <= r; dy++) {
      var w = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
      ctx.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
  }

  function bloom(f, gx, fy) {
    var i, a, j, ang;
    switch (f.id) {
      case 'sun':           /* 太阳花：一圈花瓣 + 棕色花心 */
        for (i = 0; i < 8; i++) {
          a = i * Math.PI / 4 + 0.4;
          px(gx + Math.round(Math.cos(a) * 4.2) - 1, fy + Math.round(Math.sin(a) * 4.2) - 1,
             3, 2, i % 2 ? '#f2c14a' : '#e0a636');
        }
        disc(gx, fy, 2, '#8a5f2a');
        px(gx - 1, fy - 1, 1, 1, '#6b4620');
        px(gx + 1, fy + 1, 1, 1, '#a5753a');
        break;

      case 'pansy':         /* 三色堇：上两瓣深紫、下瓣奶油、花心黄点 */
        px(gx - 4, fy - 5, 4, 3, '#7b4f9b');
        px(gx + 1, fy - 5, 4, 3, '#7b4f9b');
        px(gx - 3, fy - 4, 2, 1, '#9a6cba');
        px(gx + 2, fy - 4, 2, 1, '#9a6cba');
        px(gx - 5, fy - 2, 4, 3, '#b98fd0');
        px(gx + 2, fy - 2, 4, 3, '#b98fd0');
        px(gx - 3, fy + 1, 7, 3, '#f7efd4');
        px(gx - 2, fy + 4, 5, 1, '#e8dcc0');
        px(gx - 1, fy - 1, 3, 3, '#4e3d78');
        px(gx - 1, fy - 5, 3, 2, '#5f4287');
        px(gx, fy + 1, 1, 1, '#f2d24a');
        break;

      case 'jasmine':       /* 茉莉：五片白瓣，黄心 */
        for (i = 0; i < 5; i++) {
          a = i * Math.PI * 2 / 5 - Math.PI / 2;
          px(gx + Math.round(Math.cos(a) * 3.4) - 1, fy + Math.round(Math.sin(a) * 3.4) - 1, 3, 3, '#fbf8ee');
        }
        disc(gx, fy, 1, '#f0e2a0');
        px(gx, fy, 1, 1, '#e2c96a');
        break;

      case 'mint':          /* 薄荷：一小丛带叶脉的叶子 */
        var lv = [[0, -4], [4, -1], [-4, -1], [2, 3], [-2, 3]];
        for (i = 0; i < lv.length; i++) {
          px(gx + lv[i][0] - 2, fy + lv[i][1] - 1, 5, 3, '#6f9e58');
          px(gx + lv[i][0] - 1, fy + lv[i][1] - 2, 3, 1, '#8cb972');
          px(gx + lv[i][0], fy + lv[i][1], 1, 1, '#4f7a46');
        }
        px(gx - 1, fy - 1, 3, 3, '#4f7a46');
        break;

      case 'petunia':       /* 牵牛：正面的喇叭，五道放射浅纹 */
        disc(gx, fy, 4, '#7f83d8');
        disc(gx, fy, 3, '#9b9ee2');
        for (i = 0; i < 5; i++) {
          ang = i * Math.PI * 2 / 5 - Math.PI / 2;
          px(gx + Math.round(Math.cos(ang) * 2), fy + Math.round(Math.sin(ang) * 2), 1, 1, '#dedbf6');
          px(gx + Math.round(Math.cos(ang) * 3), fy + Math.round(Math.sin(ang) * 3), 1, 1, '#cfcbf0');
        }
        disc(gx, fy, 1, '#fbf8ff');
        break;

      case 'rose':          /* 月季：一层层往里收 */
        disc(gx, fy, 4, '#b8403b');
        disc(gx, fy, 3, '#d0665b');
        disc(gx + 1, fy, 1, '#a8332f');
        px(gx - 3, fy - 2, 2, 1, '#e0857a');
        px(gx - 2, fy, 3, 1, '#c14a42');
        px(gx - 1, fy + 2, 3, 1, '#a8332f');
        px(gx + 2, fy - 2, 2, 1, '#c85a50');
        break;

      case 'gardenia':      /* 栀子：六片厚白瓣 */
        for (i = 0; i < 6; i++) {
          a = i * Math.PI / 3;
          px(gx + Math.round(Math.cos(a) * 3.6) - 1, fy + Math.round(Math.sin(a) * 3.6) - 1, 3, 3, '#fbf7e6');
          px(gx + Math.round(Math.cos(a) * 4.6), fy + Math.round(Math.sin(a) * 4.6), 1, 1, '#efe8cf');
        }
        disc(gx, fy, 2, '#f4edd2');
        px(gx, fy, 1, 1, '#e8d98a');
        break;

      case 'succulent':     /* 多肉：一圈尖叶的莲座 */
        for (i = 0; i < 8; i++) {
          a = i * Math.PI / 4 + 0.2;
          px(gx + Math.round(Math.cos(a) * 3.5) - 1, fy + Math.round(Math.sin(a) * 3.5) - 1, 2, 2, i % 2 ? '#8fae86' : '#7fa077');
        }
        disc(gx, fy, 2, '#8fae86');
        disc(gx, fy, 1, '#6f9a6a');
        px(gx - 1, fy - 1, 1, 1, '#a9c39c');
        break;
    }
  }

  /* ---------- 绘制：花盆与花 ---------- */
  function drawPot(i) {
    if (i >= activePots()) return;
    var cx = POT_X[i], base = POT_BASE, top = POT_TOP;
    var pot = st.pots[i];

    /* 托盘：比盆底宽出一指，边缘受光 */
    px(cx - 16, base + 1, 32, 1, 'rgba(30,20,10,.28)');
    px(cx - 17, base - 5, 34, 1, '#e2aa7a');
    px(cx - 18, base - 4, 36, 2, '#c1804f');
    px(cx - 17, base - 2, 34, 1, '#9c6039');
    px(cx - 14, base - 1, 28, 1, '#7a4829');

    /* 口沿：一道厚唇，顶面受光、下面留暗槽 */
    px(cx - 15, top, 30, 1, '#e2ab7b');
    px(cx - 14, top + 1, 28, 1, '#cf8f60');
    px(cx - 14, top + 2, 28, 2, '#b4734a');
    px(cx - 14, top + 4, 28, 1, 'rgba(88,46,25,.55)');
    px(cx - 15, top + 1, 1, 1, 'rgba(240,198,158,.6)');

    /* 盆身：四道收分，左受光右背光 */
    var bands = [[6, 28], [5, 26], [5, 24], [4, 22]];
    var y = top + 5;
    for (var b = 0; b < bands.length; b++) {
      var bh = bands[b][0], bw = bands[b][1], bx = cx - (bw >> 1);
      px(bx, y, bw, bh, C.pot);
      px(bx, y, 1, bh, 'rgba(230,172,126,.45)');
      px(bx + 1, y, 1, bh, 'rgba(230,172,126,.18)');
      px(bx + bw - 2, y, 2, bh, 'rgba(105,58,34,.26)');
      y += bh;
    }
    px(cx - 11, base - 6, 22, 1, 'rgba(105,58,34,.35)');
    /* 陶土斑：让表面不至于一块死色 */
    px(cx - 9, top + 10, 6, 1, 'rgba(150,89,58,.20)');
    px(cx + 3, top + 16, 5, 1, 'rgba(150,89,58,.16)');
    px(cx - 6, top + 6, 4, 1, 'rgba(232,178,136,.35)');

    /* 土：比口沿低两像素，透出盆口的厚度 */
    px(cx - 12, top + 2, 24, 2, '#4a3826');
    px(cx - 12, top + 2, 24, 1, '#3a2b1d');
    px(cx - 12, top + 2, 1, 2, 'rgba(126,90,60,.45)');

    var f = pot.seed ? flowerOf(pot.seed) : null;
    var gx = cx, gy = top + 3;

    if (pot.phase === 'empty') {
      /* 土上的十字，提示可以种 */
      ctx.fillStyle = 'rgba(251,247,234,.8)';
      ctx.fillRect(gx - 1, gy + 1, 3, 1);
      ctx.fillRect(gx, gy, 1, 3);
      return;
    }

    if (pot.phase === 'grow') {
      var g = f.grow / (st.buff.pro > 0 ? 2 : 1);
      var k = clamp(pot.t / g, 0, 1);
      if (k < 0.3) {
        px(gx - 1, gy - 2, 2, 3, C.stem);
      } else if (k < 0.65) {
        px(gx, gy - 7, 1, 7, C.stem);
        px(gx - 4, gy - 6, 3, 2, C.leaf);
        px(gx + 2, gy - 8, 3, 2, C.leaf);
      } else {
        px(gx, gy - 12, 1, 12, C.stem);
        px(gx - 5, gy - 10, 4, 2, C.leaf);
        px(gx + 2, gy - 13, 4, 2, C.leaf);
        px(gx - 2, gy - 15, 5, 4, f.c);
        px(gx, gy - 16, 1, 1, 'rgba(251,247,234,.7)');
      }
      /* 生长条画在盆身上，不占天空 */
      px(cx - 10, base - 8, 20, 2, 'rgba(37,48,28,.2)');
      px(cx - 10, base - 8, Math.max(1, Math.round(20 * k)), 2, C.stem);
      return;
    }

    /* 开花 */
    var bob = Math.sin(tNow * 2 + i) > 0 ? 0 : -1;
    px(gx, gy - 16 + bob, 1, 16, C.stem);
    px(gx - 5, gy - 12, 4, 2, C.leaf);
    px(gx + 2, gy - 14, 4, 2, C.leaf);
    var fy = gy - 18 + bob;

    bloom(f, gx, fy);

    /* 可收获的微光 */
    var tw = (Math.sin(tNow * 4 + i * 2) + 1) * 0.5;
    if (tw > 0.72) px(gx + 4, fy - 3, 1, 1, 'rgba(251,247,234,.85)');
    if (tw < 0.2) px(gx - 6, fy + 2, 1, 1, 'rgba(251,247,234,.7)');
  }

  /* ---------- 绘制：鸟 ---------- */
  /* 一只胖雀：圆脑袋 + 蛋形身子合成「花生」剪影，尾巴是身体左缘长出的短楔子。
     剪影用圆/椭圆的解析式算行跨度，描边则用「同圆心、半径 +1」再算一遍，
     这样边缘是平滑的像素弧线，不会出现描边台阶。 */
  function makeSil(hr, brx, bry, hx, hy, bx, by) {
    var rows = [], y, a, b, w, dh, db;
    for (y = Math.floor(hy - hr); y <= Math.ceil(by + bry); y++) {
      a = null; b = null;
      db = (y - by) / bry;
      if (Math.abs(db) <= 1) {
        w = brx * Math.sqrt(1 - db * db);
        a = bx - w; b = bx + w;
      }
      dh = (y - hy) / hr;
      if (Math.abs(dh) <= 1) {
        w = hr * Math.sqrt(1 - dh * dh);
        a = a === null ? hx - w : Math.min(a, hx - w);
        b = b === null ? hx + w : Math.max(b, hx + w);
      }
      if (a === null) continue;
      rows.push([y, Math.round(a), Math.round(b)]);
    }
    return rows;
  }

  var HX = 4.5, HY = -17.6, HR = 4.7;
  var BX = 0, BY = -9.6, BRX = 7.1, BRY = 6.1;
  var BSIL = makeSil(HR, BRX, BRY, HX, HY, BX, BY);
  var BSILO = makeSil(HR + 1, BRX + 1, BRY + 1, HX, HY, BX, BY);

  function drawBird(b) {
    if (b.spec.id === 'dove') { drawDove(b); return; }
    var s = b.spec, f = b.face || 1;
    var fly = b.phase === 'in' || b.phase === 'out';
    var x = Math.round(b.x);
    var y = Math.round(b.y === undefined ? SILL : b.y);
    if (fly) y += Math.round(Math.sin(b.t * 11) * 1);
    else if (b.act !== 'walk') y += Math.sin(b.t * 2.1) > 0.6 ? -1 : 0;

    function row(r, a, c, col) {
      var xa = x + a * f, xb = x + c * f, t;
      if (xa > xb) { t = xa; xa = xb; xb = t; }
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(xa), y + r, Math.round(xb - xa + 1), 1);
    }
    function L(r) { for (var i = 0; i < BSIL.length; i++) if (BSIL[i][0] === r) return BSIL[i][1]; return 0; }
    function R(r) { for (var i = 0; i < BSIL.length; i++) if (BSIL[i][0] === r) return BSIL[i][2]; return 0; }

    /* 影子 */
    if (fly) px(x - 4, SILL + 1, 9, 1, 'rgba(37,48,28,.10)');
    else {
      px(x - 5, y - 2, 11, 1, 'rgba(37,48,28,.22)');
      px(x - 3, y - 1, 7, 1, 'rgba(37,48,28,.12)');
    }

    /* 尾羽：从身体左缘斜着拖出去，长尾的再拖长一截 */
    var tail = [], ext = s.tail ? [[-9, 9], [-8, 13], [-7, 14], [-6, 11]] : [[-9, 4], [-8, 6], [-7, 6], [-6, 4]];
    for (var q = 0; q < ext.length; q++) {
      var edge = L(ext[q][0]);
      tail.push([ext[q][0], edge - ext[q][1], edge + 1]);
    }

    /* 描边：用大一号的剪影垫底 */
    for (var o = 0; o < BSILO.length; o++) row(BSILO[o][0], BSILO[o][1], BSILO[o][2], 'rgba(38,29,19,.52)');
    for (var o2 = 0; o2 < tail.length; o2++) row(tail[o2][0], tail[o2][1] - 1, tail[o2][2] + 1, 'rgba(38,29,19,.52)');

    /* 尾 + 底色 */
    for (var k = 0; k < tail.length; k++) row(tail[k][0], tail[k][1], tail[k][2], s.wing);
    for (k = 0; k < BSIL.length; k++) row(BSIL[k][0], BSIL[k][1], BSIL[k][2], s.body);

    /* 背与翅：身体左半边压深 */
    for (var r1 = -16; r1 <= -3; r1++) row(r1, L(r1), 0, s.wing);
    /* 腹部：右下一大片暖白 */
    for (var r2 = -13; r2 <= -3; r2++) row(r2, 1, R(r2), s.belly);
    /* 脸颊：跟肚子连成一块 */
    for (var r3 = -17; r3 <= -14; r3++) row(r3, 4, R(r3), s.belly);
    /* 头顶的栗色 */
    for (var r4 = -23; r4 <= -18; r4++) row(r4, L(r4), R(r4), s.head);
    /* 白头鹎：后脑那块招牌白斑 */
    if (s.nape) {
      row(-21, L(-21) + 1, L(-21) + 4, s.belly);
      row(-20, L(-20) + 1, L(-20) + 5, s.belly);
      row(-19, L(-19) + 1, L(-19) + 4, s.belly);
      row(-18, L(-18) + 1, L(-18) + 3, s.belly);
    }
    /* 喉下的深色胸带：半透明压暗，别做成一块黑 */
    for (var r5 = -16; r5 <= -13; r5++) row(r5, 1, 4, 'rgba(36,26,16,.28)');

    /* 翅膀上的杂色羽斑，让它不至于是一块死色 */
    row(-13, -4, -2, 'rgba(40,30,18,.24)');
    row(-12, -5, -3, 'rgba(40,30,18,.20)');
    row(-11, -6, -3, 'rgba(40,30,18,.24)');
    row(-15, -3, -1, 'rgba(251,247,234,.14)');
    row(-12, -7, -6, 'rgba(251,247,234,.10)');
    row(-10, -5, -4, 'rgba(251,247,234,.08)');
    /* 翅与肚的分界 */
    for (var r6 = -14; r6 <= -4; r6++) row(r6, 0, 1, 'rgba(40,30,18,.18)');

    /* 眼睛：醒着是一点黑加高光，睡了就眯成一条线 */
    if (b.act === 'sleep' && !fly) {
      row(-18, 5, 7, 'rgba(40,30,18,.5)');
    } else {
      row(-18, 6, 6, '#17160f');
      if (!fly) row(-19, 6, 6, 'rgba(251,247,234,.55)');
    }
    /* 喙：小三角，压在脸颊前面 */
    row(-17, 9, 11, s.beak);
    row(-16, 9, 10, s.beak);

    /* 腿脚：细而暗，别抢眼睛的颜色 */
    var LEG = '#5a4632';
    if (fly) {
      row(-4, 1, 1, LEG);
      row(-4, 4, 4, LEG);
      var up = Math.floor(b.t * 18) % 2;
      if (up) { row(-19, -8, -2, s.wing); row(-20, -10, -5, s.wing); }
      else { row(-7, -8, -1, s.wing); row(-6, -10, -4, s.wing); }
    } else {
      var lift = (b.act === 'walk' && Math.sin(b.step) > 0) ? 1 : 0;
      for (var g = -3 + lift; g <= -1; g++) row(g, 1, 1, LEG);
      for (var g2 = -3 + (1 - lift); g2 <= -1; g2++) row(g2, 4, 4, LEG);
      row(-1, 0, 2, LEG);
      row(-1, 3, 6, LEG);
    }

    /* 睡着了，头顶冒个 z */
    if (b.act === 'sleep' && !fly) {
      var zt = (b.t * 0.55) % 1;
      var za = zt < 0.2 ? zt / 0.2 : (1 - zt) / 0.8;
      var zx = x + 7 * f, zy = y - 26 - Math.round(zt * 5);
      ctx.globalAlpha = Math.max(0, Math.min(1, za)) * 0.8;
      px(zx, zy, 3, 1, '#f8f4e4');
      px(zx + 2, zy + 1, 1, 1, '#f8f4e4');
      px(zx, zy + 2, 3, 1, '#f8f4e4');
      ctx.globalAlpha = 1;
    }

    /* 冠羽（戴胜） */
    if (s.crest) {
      row(-22, 3, 6, '#d96f3a');
      row(-23, 4, 5, '#e8925a');
      row(-23, 7, 7, '#e8925a');
      row(-24, 5, 5, '#f0a870');
    }
    /* 眼罩（伯劳） */
    if (s.mask) row(-18, 3, 8, 'rgba(37,48,28,.8)');

    /* 稀有种的微光 */
    if (s.w <= 1.5 && b.phase === 'perch') {
      var a2 = (Math.sin(tNow * 3 + x) + 1) * 0.5;
      if (a2 > 0.6) px(x + 2, y - 25, 1, 1, 'rgba(251,247,234,.9)');
    }
  }

  /* ---------- 绘制：珠颈斑鸠 ----------
     体型约为麻雀的两倍：身宽、胸鼓、头小，尾羽自腰后斜拖，
     颈侧一圈黑底白点的「珍珠」，正是它名字的由来。
     剪影沿用 makeSil 的「圆脑袋 + 蛋身子」并集，描边才是一整圈顺的。 */
  var DV_HX = 7.2, DV_HY = -34.2, DV_HR = 5.7;
  var DV_BX = 0, DV_BY = -19.6, DV_BRX = 14, DV_BRY = 11.2;
  var DSIL = makeSil(DV_HR, DV_BRX, DV_BRY, DV_HX, DV_HY, DV_BX, DV_BY);
  var DSILO = makeSil(DV_HR + 1, DV_BRX + 1, DV_BRY + 1, DV_HX, DV_HY, DV_BX, DV_BY);

  function drawDove(b) {
    var f = b.face || 1;
    var fly = b.phase === 'in' || b.phase === 'out';
    var x = Math.round(b.x);
    var y = Math.round(b.y === undefined ? SILL : b.y);
    if (fly) y += Math.round(Math.sin(b.t * 9) * 2);
    else if (b.act !== 'walk') y += Math.sin(b.t * 1.6) > 0.78 ? -1 : 0;

    function row(r, a, c, col) {
      var xa = x + a * f, xb = x + c * f, t;
      if (xa > xb) { t = xa; xa = xb; xb = t; }
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(xa), y + r, Math.round(xb - xa + 1), 1);
    }
    /* 头部圆在该行的左右，用于分色 */
    function hspan(r) {
      var d = (r - DV_HY) / DV_HR;
      if (Math.abs(d) > 1) return null;
      var w = DV_HR * Math.sqrt(1 - d * d);
      return [Math.round(DV_HX - w), Math.round(DV_HX + w)];
    }

    var LINE = '#2c231e';
    var HEAD = '#b7bdc4', HEAD_HI = '#cbd1d7', HEAD_DK = '#9ba2aa';
    var BODY = '#b48b91', BODY_HI = '#c49da3';
    var BELLY = '#d8b9b1', BELLY_HI = '#e6cfc6';
    var WING = '#8f6e68', WING_DK = '#6f534d', WING_HI = '#a9857d';
    var TAIL = '#7d675e', TAIL_DK = '#5f4a44', TAIL_HI = '#8e776c';
    var NECK = '#332a26', BEAK = '#3b332e', LEG = '#a8453a';

    var i, r, j, a, c2, sp, hs, s, ty, tx1, tx2;

    /* 影子 */
    if (fly) px(x - 10, SILL + 1, 21, 1, 'rgba(37,48,28,.10)');
    else {
      px(x - 12, y - 2, 25, 1, 'rgba(37,48,28,.19)');
      px(x - 8, y - 1, 17, 1, 'rgba(37,48,28,.10)');
    }

    /* 尾羽：自腰后斜拖出去，根部厚、尖端薄，尾上两道分羽线 */
    for (s = 0; s <= 6; s++) {
      ty = -15 + Math.round(s * 0.6);
      tx1 = -11 - s * 2; tx2 = tx1 - 3;
      var th = s < 3 ? 4 : (s < 5 ? 3 : 2);
      row(ty - 1, tx2, tx1, LINE);
      row(ty + th, tx2, tx1, LINE);
      for (i = 0; i < th; i++) row(ty + i, tx2, tx1, i === th - 1 ? TAIL_DK : TAIL);
    }

    /* 剪影描边 + 底色 */
    for (i = 0; i < DSILO.length; i++) row(DSILO[i][0], DSILO[i][1], DSILO[i][2], LINE);
    for (i = 0; i < DSIL.length; i++) {
      r = DSIL[i][0]; a = DSIL[i][1]; c2 = DSIL[i][2];
      row(r, a, c2, BODY);
      hs = hspan(r);
      if (hs && r <= -29) row(r, Math.max(hs[0], a), Math.min(hs[1], c2), HEAD);
    }

    /* 背与翅：翅覆在体侧，后缘斜着收到腰上 */
    function BR(r) {
      var d = (r - DV_BY) / DV_BRY;
      if (Math.abs(d) > 1) return 0;
      return Math.round(DV_BX + DV_BRX * Math.sqrt(1 - d * d));
    }
    function BL(r) {
      var d = (r - DV_BY) / DV_BRY;
      if (Math.abs(d) > 1) return 0;
      return Math.round(DV_BX - DV_BRX * Math.sqrt(1 - d * d));
    }
    /* 翅膀是一块椭圆羽区，前缘顺着头往下收 */
    var WE = { x: -3.2, y: -20.4, rx: 10.2, ry: 7.8 };
    function wsp(r) {
      var d = (r - WE.y) / WE.ry;
      if (Math.abs(d) > 1) return null;
      var w = WE.rx * Math.sqrt(1 - d * d);
      return [Math.round(WE.x - w), Math.round(WE.x + w)];
    }
    function WR(r) { var p = wsp(r); return p ? p[1] : -8; }
    /* 胸腹：暖白，靠翅一侧压一档过渡 */
    for (r = -27; r <= -9; r++) row(r, WR(r) + 1, BR(r) - 1, BELLY);
    for (r = -24; r <= -11; r++) row(r, WR(r) + 3, BR(r) - 2, BELLY_HI);
    /* 羽区本体 */
    for (r = -28; r <= -13; r++) {
      var wp = wsp(r); if (!wp) continue;
      row(r, Math.max(wp[0], BL(r) + 1), wp[1], WING);
    }
    /* 三道羽缘：沿羽区弧度往下弯 */
    for (i = 0; i < 2; i++) {
      var ay = -24 + i * 5, ap = wsp(ay); if (!ap) continue;
      var ax0 = ap[0] + 1, ax1 = ap[1] - 1, an = ax1 - ax0;
      if (an < 3) continue;
      for (j = 0; j <= an; j++)
        px(x + (ax0 + j) * f, y + ay + Math.round(Math.sin(j / an * Math.PI) * 1.5), 1, 1, WING_DK);
    }
    var hp = wsp(-27);
    if (hp) row(-27, hp[0] + 2, hp[1] - 1, WING_HI);
    for (r = -26; r <= -14; r++) { var q2 = wsp(r); if (q2) row(r, q2[1], q2[1] + 1, 'rgba(43,34,29,.18)'); }

    /* 头顶高光与颈侧阴影 */
    for (r = -39; r <= -36; r++) { hs = hspan(r); if (hs) row(r, hs[0] + 2, hs[1] - 2, HEAD_HI); }
    for (r = -31; r <= -29; r++) { hs = hspan(r); if (hs) row(r, hs[0] + 1, Math.min(hs[1] - 1, 4), HEAD_DK); }

    /* 颈侧「珍珠」：贴着下巴的一圈黑底白点，不往胸口漫 */
    var coll = [[-31, 3, 8], [-30, 2, 9], [-29, 2, 10], [-28, 2, 10], [-27, 3, 9]];
    for (i = 0; i < coll.length; i++) row(coll[i][0], coll[i][1], coll[i][2], NECK);
    var dots = [[4, -30], [6, -30], [8, -30], [3, -29], [5, -29], [7, -29], [9, -29], [4, -28], [6, -28], [8, -28]];
    for (i = 0; i < dots.length; i++) px(x + dots[i][0] * f, y + dots[i][1], 1, 1, '#e8ded0');

    /* 眼睛：橙圈黑点，睡觉时眯成一线 */
    if (b.act === 'sleep' && !fly) {
      row(-37, 8, 10, 'rgba(43,34,29,.5)');
    } else {
      row(-37, 9, 11, '#d98436');
      row(-36, 9, 11, '#d98436');
      px(x + 10 * f, y - 37, 1, 1, '#15120e');
      px(x + 9 * f, y - 36, 1, 1, '#15120e');
      px(x + 11 * f, y - 36, 1, 1, '#f6f1e6');
    }
    /* 喙：短、暗、微微向下 */
    row(-35, 11, 13, BEAK);
    row(-34, 11, 15, BEAK);
    row(-33, 12, 13, BEAK);

    /* 腿脚：暗红，比麻雀粗一号 */
    if (fly) {
      row(-8, 1, 1, LEG);
      row(-8, 5, 5, LEG);
      row(-7, 0, 2, LEG);
      row(-7, 4, 6, LEG);
    } else {
      var lift = (b.act === 'walk' && Math.sin(b.step) > 0) ? 1 : 0;
      for (var g = -7 + lift; g <= -2; g++) row(g, 1, 1, LEG);
      for (var g2 = -7 + (1 - lift); g2 <= -2; g2++) row(g2, 5, 5, LEG);
      row(-1, -1, 2, LEG);
      row(-1, 4, 7, LEG);
    }

    /* 睡着时头顶冒 z */
    if (b.act === 'sleep' && !fly) {
      var zt = (b.t * 0.55) % 1;
      var za = zt < 0.2 ? zt / 0.2 : (1 - zt) / 0.8;
      var zx = x + 11 * f, zy = y - 45 - Math.round(zt * 6);
      ctx.globalAlpha = Math.max(0, Math.min(1, za)) * 0.8;
      px(zx, zy, 3, 1, '#f8f4e4');
      px(zx + 2, zy + 1, 1, 1, '#f8f4e4');
      px(zx, zy + 2, 3, 1, '#f8f4e4');
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- 绘制：羽毛 ---------- */
  function drawFeather(f) {
    var bob = Math.round(Math.sin(tNow * 2.4 + f.seed) * 1.2);
    var x = Math.round(f.x), y = Math.round(f.y) + bob;
    var life = f.life / 30;
    var alpha = life < 0.25 ? (Math.sin(tNow * 9) > 0 ? 0.42 : 0.95) : 1;
    var N = 16, top = y - 11;

    /* 羽片行跨度：上端圆、中段宽、下端收成尖 */
    function span(i) {
      var w = i < 2 ? 2 : i < 4 ? 3 : i < 11 ? 5 : i < 13 ? 4 : i < 15 ? 3 : 1;
      return { ox: -Math.round(i * 0.5), w: w };
    }
    function shape(dx, dy, col) {
      ctx.fillStyle = col;
      for (var i = 0; i < N; i++) {
        var r = span(i);
        ctx.fillRect(x + r.ox + dx, top + i + dy, r.w, 1);
      }
    }

    ctx.globalAlpha = alpha;
    /* 影子 */
    px(x - 3, y + 6, 8, 1, 'rgba(37,48,28,.15)');

    /* 一圈 1px 描边 */
    shape(-1, 0, 'rgba(43,36,25,.5)');
    shape(1, 0, 'rgba(43,36,25,.5)');
    shape(0, -1, 'rgba(43,36,25,.5)');
    shape(0, 1, 'rgba(43,36,25,.5)');

    /* 羽片本体：纸白 + 鸟羽色做侧边 */
    shape(0, 0, '#fbf7ea');
    ctx.fillStyle = (f.col || '#e8dcc2');
    for (var i = 2; i < 14; i++) {
      var r = span(i);
      ctx.fillRect(x + r.ox + r.w - 2, top + i, 2, 1);
    }
    /* 羽轴 */
    ctx.fillStyle = '#d3c9ad';
    for (var k = 0; k < N; k++) {
      var r2 = span(k);
      ctx.fillRect(x + r2.ox + r2.w - 1, top + k, 1, 1);
    }
    /* 羽枝的细纹 */
    ctx.fillStyle = 'rgba(37,48,28,.10)';
    ctx.fillRect(x - 2, top + 5, 1, 1);
    ctx.fillRect(x - 3, top + 8, 1, 1);
    ctx.fillRect(x - 4, top + 11, 1, 1);

    /* 闪光 */
    var tw = (Math.sin(tNow * 3 + f.seed * 2) + 1) * 0.5;
    if (tw > 0.55) {
      px(x - 8, top - 2, 1, 1, 'rgba(255,252,235,.95)');
      px(x + 4, top + 5, 1, 1, 'rgba(255,252,235,.7)');
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- 绘制：飘字 ---------- */
  function drawFx() {
    for (var i = 0; i < fx.length; i++) {
      var f = fx[i];
      var a = f.life / f.max;
      ctx.globalAlpha = a > 0.7 ? 1 : Math.max(0, a / 0.7);
      pxText(f.text, f.x, f.y - (1 - a) * 14, f.color, 1);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- 窗台上的那盆茉莉：来自拼豆图纸，65×96 原格 1:1 ---------- */
  var JASMINE = {
    w: 65, h: 96,
    pal: { a: '#faf6e2', b: '#f2edcf', c: '#d6dba4', d: '#98ac69', e: '#617133', f: '#3c4a22' },
    rows: [
      "...................................a.aaa.........................",
      "....................aa.............aa.aa.aa......................",
      "....................aaa............aaaddaaa......................",
      "....................aaaa............addaaa.......................",
      "....................aaaa.....eee....ddd..........................",
      ".....................dddd...eeed....ede..........................",
      ".....................dddd..eeed......e...........................",
      "......................dde.eeedd.....e.......a....................",
      ".............dddddd....ee.eedd......e......aaa...................",
      "............dddddddd....eeee...dddde...aaa.aaa...................",
      "...........ddddeeeeeee...ee...eeddddde.aaa.aaaa.aa...............",
      "...........eeeeeeeeeeee..ee....eeeddddeaaaadaa.aaa...............",
      "..........e....eeee...ee.e.....eeeeddeda.daddaaaaa...............",
      "........................eee.....eeeee.aaaaddddaa....aa...........",
      "..........................e.....eeeee.aaaaaadaaa...aaa...........",
      "..........................ee....eeeee..aaaa.a.aaaa.da.daa........",
      "...............aaa...aa...ee....e.eeeeeedd.aa.aaaaddddaa.........",
      "...............aaa..aaa....e...e....eeee..aaa.daaadeeda..........",
      "...............aaadaaaa.....e..e.......e.daaadddddeed............",
      "...............aaaaaaa......e.ee.......e.e..deedddd..............",
      "............aa.aaadad.aa....eee........eee.eeeeedddd.............",
      "............aaa.addaaaaaaad..eddd......eee..eeeeeddd.............",
      "............aaaaddadaaaaa.d.ddddddd....ee....eeeeeddd............",
      ".............aaa.aaa.aaa...dddeeeeee..ee......eeeeddd............",
      ".............aa.aaaae.....ddddeee.....ee.......eeeedd............",
      "......a......aa.aaaaddd..ddddeee......e...ddd....eeed....aa......",
      ".....aa......aa.aaaa.ee..ddeeeee.....ee.dddddddd....d...aaa...aa.",
      "....aaaa.....aa.aaa.eee..deeee......ee.ddddddddd........daa..aaa.",
      "....aaaa.....dd..a....ee.eee.......ee.ddddeeedddd.......ddd.daaa.",
      ".....dd..........d.....eee.........eeeeeeeeeeedddd.......dd.daaa.",
      ".....ddd...............eee.dddd....ee..eeeeeeeee.........dd.daad.",
      ".ad...ee.....dde........ee.edddd...e.....eeee.....dddd....e.edd..",
      "aaad...e....dde..........eeeeedd..ee.......aaa...dddddd...ee.....",
      ".adee..e...ddee....eeeee..e..eee..e...aaa..aaa....eddddd..e......",
      "....eeee..ddee....edddddee.e..ee..e...aaaa.aaaa...eedddd.e.ddddd.",
      ".......ee.ddee...eddeeeddeee...edee...aaa.aaaaa....eeddd.eeeedddd",
      "........eddde...eddedddee..ee....e..aadaa.daaa.aaadeeedde.eeeeddd",
      ".........ede....ededdeee....e....e.aaaa.a.ddad.aaaa.eeeee...eeeed",
      "....edde..ee....dede......eedde..e.aaaaaaaaddaaaaa.....e.......ee",
      "..eddddee..e....de.........deddd.e..aaa.da...da......de.........e",
      ".eddeeeddeeee.....aa........ddedde..d..aaa.adaaaa....e.dddddd....",
      "eddedddde...ee....aaad.eeee..ddeee.eee.aaaa.aa.aa...eeeedddddd...",
      "ededddde......ee..aaad..eeeee.ddee.eee.aaaa.aa.aa...e.eeeeedddd..",
      "dedddee........ee..add...eeeee.eee..eed.aaa.aa.aa.de...eeeeeddd..",
      "edeee...........e..dde....eeeee.ee.e.ee.aaae.ae..de.....eeeeeddd.",
      "e........eeeee..ee.dde.....eeeee.e.eee.....eeee.dee.....eeeeeedd.",
      ".........eedddeeeeede.........eede..eeeeee...ee.e.........eeeeed.",
      ".......eedddeeeeeeeee..eeeee...eee...eddddeee..e..ddddd......eee.",
      ".......eddeeddde..eeeeededdde...ee..eeeeedddddeeeeeddddd.......e.",
      "......eededdddd.....eedddeddde..ee..edddeedddde..eeeedddd........",
      "......eddedddd...eee.eedddeedde.ee...edddeeeedde.eeeeeddd........",
      "......ededddd...eeddeeeeddddede.ee.e.eedddddeeee..eeeeedd........",
      "......eedddd...eeddde..eeddddee.ee.e.e.eeeee....d..eeeeed........",
      ".....eeddd....deddd.......eeeeedeedeee....e....ed...eeeed........",
      ".....eed......edd...........eeeeeee.ee...de....eddd.....e..aa....",
      ".....e.................eeeeee.eeeee.ee...ee....eeddd.....ddaaa...",
      ".........eeeeee.......eeeede...eeeed.e..ee.....eeedd.....ddaaa...",
      ".......eeeeeeee...e..eeeddde....eeee.e.de.dd...eeedd....dddd.....",
      "......eeeeddddee.ed..eedddd.....ee.e.e.ee.eddd..eedd.deeeedd.....",
      ".....eeeedddddddeed..eddde......ee.e.ede..eeddd.eededeee.........",
      ".....eeeddddddde.eee.edee.ddeeeeee.e.eee..eeddd..eedee.d.........",
      "....eeeddddddee....ee.e...eededdde.e.ee...eeedd.deeeedeee........",
      "....eedddddee.......eee...edddedde.e.ee...eeeddeeeeeeeeeeee......",
      "....edeeeee....eeeeedeee..eddddede.e.eeedd.eedddee.dddeeeeee.....",
      "....de.......deeeeeeedeee.eedddede.e.e.eddd.edeee...ddddeeee.....",
      "....e........eeeeddddeeeee.e.dddee.e.e.eedd.dee.d...ddddddeee....",
      ".............eeeddddeeeddeee..eeee.e.e..eeddeeeee....ddddddee....",
      ".............eeddddeeedde..ee...ee.e.e...eeeedddeee......ddde....",
      ".............edde..eeddd....ed..ee.e.e...dee.dddddded......d.....",
      ".............e.....edde.....ee..eede.e...ee....ddddde............",
      "..................eeee.......eddeeee.e..ee........ddde...........",
      "...................ddddddddddeeeeeeededdedddddd..................",
      "................dddd.ddddeeeeeeeeeeeeeeeeddddddddd...............",
      "..............ddd...ddeeeeeeeeeeeeeeeeeeeeeeed...ddd.............",
      "..............d....deeeeeeeeeeeeeeeeeeeeeeeeee.....d.............",
      "...............dd.....ddddddddddddddddddd........dd..............",
      "................aaaaaaaaaaaaaaaaaaaaaaaaaabbbb...................",
      "................aaadddddddddddddddddddddddddddbbbb...............",
      "..............cccccccccccccccccccccccccccccccccccccc.............",
      "..............aaaadaaaaaaaaaaaaaaaaaaaaaaaaaaaadbbbb.............",
      "..............aaadddddddddddddddddddddddddddddddbbbb.............",
      "..............aaadaaaaaaadaaaaaaaadaaaaaaaaaaaaabbbb.............",
      "..............aaadaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbb.............",
      "..............aaadaaaaaaaaaaaaaaaaaaaaaaaaaadaaabbbb.............",
      "..............aaadaaaaaaaaaaaaaaaaaaaaaaaaaadaaabbbb.............",
      "..............aaadaadaaaaaaaaaaaaaaaaaaaaaaaaaaabbbb.............",
      "..............aaaadaaaaaaaaaaaaaaaaaaaaaaaaaaaadbbbb.............",
      "...............aaadaaaaaaaaaaaaaaaaaaaaaaaaaabbbb................",
      "...............aaadaaaaaaaaaaaadaaaaaaaaaaaaaaabbbb..............",
      "...............aaaaaaaaaaaaaaaaadaaadaaaaaaaaadbbbb..............",
      "................aaadaaaaaaaaaaaaaaaaaaaaaaaaaabbbb...............",
      "................aaadaaaadaaaaaaaaaaaaaaaaaaaaabbbb...............",
      ".................aaaadaaaaaaaaaaaaaaaaaaaaaadbbbb................",
      ".................aaaadaaaaaaaaaaaaaaaaaaaaaadbbbb................",
      "..................aaadaaaaaaaaaaaaaaaaaaaabbbb...................",
      "..................aaaaadaaaaaaaaaaaaaaaaaadabbbb................."
    ]
  };
  var JSC = null;

  function buildJasmine() {
    var c = document.createElement('canvas');
    c.width = JASMINE.w; c.height = JASMINE.h;
    var g = c.getContext('2d'), y, x, ch;
    for (y = 0; y < JASMINE.h; y++) {
      for (x = 0; x < JASMINE.w; x++) {
        ch = JASMINE.rows[y].charAt(x);
        if (ch === '.') continue;
        g.fillStyle = JASMINE.pal[ch];
        g.fillRect(x, y, 1, 1);
      }
    }
    JSC = c;
  }

  /* ---------- 主绘制 ---------- */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!bgDone) buildBG();
    ctx.drawImage(BGC, 0, 0);
    farBirds();
    drawGlass();
    drawFrame();
    drawSill();
    drawDrops();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 308, 180); ctx.clip();
    drawLamp(282, 150);
    ctx.restore();

    if (!JSC) buildJasmine();
    px(175, 150, 62, 1, 'rgba(30,20,10,.20)');
    ctx.drawImage(JSC, 173, 54);

    drawDecor();
    for (var i = 0; i < 3; i++) drawPot(i);

    ctx.save();
    ctx.beginPath(); ctx.rect(10, 0, 300, 180); ctx.clip();
    for (var b = 0; b < birds.length; b++) drawBird(birds[b]);
    ctx.restore();
    for (var f = 0; f < feathers.length; f++) drawFeather(feathers[f]);
    drawFx();

    /* 悬停高亮 */
    if (hover.pot >= 0) {
      var cx = POT_X[hover.pot];
      ctx.strokeStyle = 'rgba(251,247,234,.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - POT_W / 2 - 1.5, POT_TOP - 1.5, POT_W + 3, POT_H + 5);
    }
  }

  /* ---------- 逻辑 ---------- */
  function spawnBird() {
    var list = [], tot = 0, i;
    for (i = 0; i < BIRDS.length; i++) {
      if (BIRDS[i].lv > st.lv) continue;
      var w = BIRDS[i].w;
      if (st.buff.berry > 0 && (BIRDS[i].id === 'bulbul' || BIRDS[i].id === 'blackbird')) w *= 3;
      if (st.buff.worm > 0 && (BIRDS[i].id === 'wagtail' || BIRDS[i].id === 'hoopoe')) w *= 3;
      list.push({ spec: BIRDS[i], w: w });
      tot += w;
    }
    if (!list.length) return;
    var r = Math.random() * tot, pick = list[0];
    for (i = 0; i < list.length; i++) { r -= list[i].w; if (r <= 0) { pick = list[i]; break; } }

    var used = {}, free = [];
    for (i = 0; i < birds.length; i++) used[birds[i].x] = 1;
    var gap = pick.spec.big ? 30 : 15;
    for (i = 0; i < PERCH.length; i++) {
      if (used[PERCH[i]]) continue;
      var near = false;
      for (var j = 0; j < birds.length; j++)
        if (birds[j].phase === 'perch' && Math.abs(birds[j].x - PERCH[i]) < gap) near = true;
      if (!near) free.push(PERCH[i]);
    }
    if (!free.length) return;
    var tx = free[Math.floor(Math.random() * free.length)];

    /* 入场方向：不再一律从右边冲过来。
       落点偏右的多从右侧掠过，偏左的多从左侧掠过，中间随机；
       起点在窗外（被画框裁掉），斜着飞进来再落到台面上。 */
    var side;
    if (tx > 210) side = Math.random() < 0.68 ? 1 : -1;
    else if (tx < 90) side = Math.random() < 0.68 ? -1 : 1;
    else side = Math.random() < 0.5 ? -1 : 1;

    var sx = side > 0 ? 338 : -18;
    var sy = rnd(34, 66);

    birds.push({
      spec: pick.spec, x: sx, y: sy, tx: tx, ty: SILL,
      cx: sx - side * 72, cy: Math.max(10, sy - 12), dir: side,
      face: side > 0 ? -1 : 1,
      phase: 'in', t: 0, stay: pick.spec.stay,
      act: 'look', actT: rnd(1.2, 2.4), wx: tx, step: 0,
      dropped: false, peckT: 0, peckTick: rnd(0.6, 1.8)
    });
  }

  /* 沿着台面踱几步，别撞到别的鸟 */
  function beginWalk(b) {
    var dir = Math.random() < 0.5 ? -1 : 1;
    var tx = clamp(b.x + dir * rnd(10, 30), 20, 300);
    for (var i = 0; i < birds.length; i++) {
      var o = birds[i];
      var need = (b.spec.big ? 30 : 15) + (o.spec.big ? 12 : 0);
      if (o !== b && o.phase === 'perch' && Math.abs(o.x - tx) < need) { tx = b.x; break; }
    }
    if (Math.abs(tx - b.x) < 4) { b.act = 'look'; b.actT = rnd(1.2, 2.4); return; }
    b.wx = tx; b.act = 'walk'; b.actT = 9;
  }

  function dropFeathers(b) {
    var n = b.spec.n;
    for (var i = 0; i < n; i++) {
      feathers.push({
        x: b.x + (i ? -7 : 1) + rnd(-1, 1),
        y: SILL - 6 + rnd(0, 3),
        life: 30, seed: rnd(0, 9),
        pts: featherPts(b.spec), bird: b.spec.id,
        col: b.spec.belly
      });
    }
    /* 首次收集奖励在点击时结算 */
  }

  function collect(f, idx) {
    st.p += f.pts;
    addRate(f.pts);
    fx.push({ text: '+' + f.pts, x: f.x - 4, y: f.y - 2, life: 1.4, max: 1.4, color: '#25301c' });
    if (!st.coll.birds[f.bird]) {
      st.coll.birds[f.bird] = 1;
      st.p += 10;
      fx.push({ text: '+10', x: f.x - 2, y: f.y - 12, life: 1.6, max: 1.6, color: '#8a3a22' });
      var nm = '';
      for (var i = 0; i < BIRDS.length; i++) if (BIRDS[i].id === f.bird) nm = BIRDS[i].name;
      toast('图鉴 · 初见 ' + nm + '　+10 P');
      blip(660, 0.14, 'triangle', 0.05);
      if (Object.keys(st.coll.birds).length === BIRDS.length && !st.bonus10) {
        st.bonus10 = true; st.p += 200;
        toast('集齐 10 种鸟　+200 P');
        blip(880, 0.3, 'triangle', 0.06);
      }
    }
    blip(520 + Math.random() * 60, 0.09, 'sine', 0.04);
    feathers.splice(idx, 1);
    syncHud();
  }

  function harvest(i) {
    var pot = st.pots[i], f = flowerOf(pot.seed);
    var h = harvestPts(f);
    st.p += h;
    addRate(h);
    fx.push({ text: '+' + h, x: POT_X[i] - 6, y: SILL - 26, life: 1.6, max: 1.6, color: '#25301c' });
    if (!st.coll.flowers[f.id]) {
      st.coll.flowers[f.id] = 1;
      st.p += 15;
      fx.push({ text: '+15', x: POT_X[i] + 4, y: SILL - 34, life: 1.8, max: 1.8, color: '#8a3a22' });
      toast('图鉴 · 初开 ' + f.name + '　+15 P');
      blip(720, 0.18, 'triangle', 0.05);
    }
    pot.phase = 'cool'; pot.t = 0;
    blip(600, 0.12, 'sine', 0.045);
    syncHud();
    save();
  }

  function addRate(p) {
    /* 60 秒滑动平均收益（每秒），用于离线结算 */
    st.rate = st.rate * 0.94 + (p / 60) * 0.06;
  }

  function tick(dt) {
    tNow += dt;
    st.played += dt;

    /* buff 计时 */
    for (var k in st.buff) if (st.buff[k] > 0) st.buff[k] = Math.max(0, st.buff[k] - dt);

    /* 鸟 */
    for (var i = birds.length - 1; i >= 0; i--) {
      var b = birds[i];
      b.t += dt;
      if (b.phase === 'in') {
        /* 二次贝塞尔：从窗外斜掠进来，收翅落在台面 */
        var k1 = clamp(b.t / 1.25, 0, 1);
        var e = 1 - Math.pow(1 - k1, 3);
        b.x = qz(b.sx, b.cx, b.tx, e);
        b.y = qz(b.sy, b.cy, SILL, e);
        if (k1 >= 1) { b.phase = 'perch'; b.t = 0; b.x = b.tx; b.y = SILL; }
      } else if (b.phase === 'perch') {
        /* 落脚之后自己安排：发呆、踱两步、打个盹 */
        if (b.peckT > 0) b.peckT -= dt;
        b.actT -= dt;

        if (b.act === 'walk') {
          var dx = b.wx - b.x;
          if (Math.abs(dx) < 0.8) {
            b.x = b.wx; b.act = 'look'; b.actT = rnd(1.4, 3.0);
          } else {
            b.x += (dx > 0 ? 1 : -1) * 7.5 * dt;
            b.face = dx > 0 ? 1 : -1;
            b.step += dt * 9;
          }
        } else {
          if (b.act === 'look') {
            b.peckTick -= dt;
            if (b.peckTick <= 0) { b.peckT = 0.35; b.peckTick = rnd(1.4, 3.4); }
          }
          if (b.actT <= 0 && b.t < b.stay - 1.2) {
            var roll = Math.random();
            if (roll < 0.52) beginWalk(b);
            else if (roll < 0.86) { b.act = 'sleep'; b.actT = rnd(2.4, 4.6); b.peckT = 0; }
            else { b.act = 'look'; b.actT = rnd(1.6, 3.2); }
          }
        }

        if (!b.dropped && b.t > b.stay * 0.5) { b.dropped = true; dropFeathers(b); }
        if (b.t >= b.stay) { b.phase = 'out'; b.t = 0; b.sx = b.x; b.sy = b.y; }
      } else {
        /* 起飞：往原来的方向斜着飞出去 */
        var k2 = clamp(b.t / 1.0, 0, 1);
        b.x = b.sx + b.dir * 360 * k2 * k2;
        b.y = b.sy - Math.sin(k2 * Math.PI * 0.5) * 96;
        if (b.t > 1.05) birds.splice(i, 1);
      }
    }

    /* 羽毛计时 */
    for (var f = feathers.length - 1; f >= 0; f--) {
      feathers[f].life -= dt;
      if (feathers[f].life <= 0) feathers.splice(f, 1);
    }

    /* 飘字 */
    for (var x = fx.length - 1; x >= 0; x--) {
      fx[x].life -= dt;
      if (fx[x].life <= 0) fx.splice(x, 1);
    }

    /* 到访节奏 */
    if (tNow >= nextAt) {
      spawnBird();
      nextAt = tNow + interval() * rnd(0.85, 1.15);
    }

    /* 花盆状态机 */
    for (var p = 0; p < activePots(); p++) {
      var pot = st.pots[p];
      if (pot.phase === 'grow') {
        pot.t += dt * (st.buff.pro > 0 ? 2 : 1);
        if (pot.t >= flowerOf(pot.seed).grow) { pot.phase = 'bloom'; pot.t = 0; blip(760, 0.2, 'sine', 0.03); }
      } else if (pot.phase === 'cool') {
        pot.t += dt;
        if (pot.t >= flowerOf(pot.seed).cool) { pot.phase = 'grow'; pot.t = 0; }
      }
    }
  }

  /* ---------- 交互 ---------- */
  function toCanvas(ev) {
    var r = CV.getBoundingClientRect();
    var cx = (ev.clientX - r.left) / r.width * W;
    var cy = (ev.clientY - r.top) / r.height * H;
    return { x: cx, y: cy };
  }

  function hitFeather(x, y) {
    for (var i = feathers.length - 1; i >= 0; i--) {
      var f = feathers[i];
      if (Math.abs(x - f.x) <= 7 && Math.abs(y - (f.y + 1)) <= 9) return i;
    }
    return -1;
  }
  function hitPot(x, y) {
    for (var i = 0; i < activePots(); i++) {
      if (x >= POT_X[i] - POT_W / 2 && x <= POT_X[i] + POT_W / 2 && y >= POT_TOP - 8 && y <= POT_BASE + 4) return i;
    }
    return -1;
  }

  CV.addEventListener('mousemove', function (e) {
    var p = toCanvas(e);
    hover.feather = hitFeather(p.x, p.y);
    hover.pot = hitPot(p.x, p.y);
    CV.style.cursor = hover.feather >= 0 ? 'pointer' : hover.pot >= 0 ? 'pointer' : 'default';
  });
  CV.addEventListener('mouseleave', function () { hover.feather = -1; hover.pot = -1; });

  CV.addEventListener('click', function (e) {
    var p = toCanvas(e);
    var fi = hitFeather(p.x, p.y);
    if (fi >= 0) { collect(feathers[fi], fi); return; }
    var pi = hitPot(p.x, p.y);
    if (pi >= 0) tapPot(pi);
  });

  /* 触屏 */
  CV.addEventListener('touchstart', function (e) {
    if (!e.touches.length) return;
    var t = e.touches[0];
    var p = toCanvas(t);
    var fi = hitFeather(p.x, p.y);
    if (fi >= 0) { e.preventDefault(); collect(feathers[fi], fi); return; }
    var pi = hitPot(p.x, p.y);
    if (pi >= 0) { e.preventDefault(); tapPot(pi); }
  }, { passive: false });

  function tapPot(i) {
    var pot = st.pots[i], f = flowerOf(pot.seed);
    if (pot.phase === 'empty') {
      if (!st.sel) { toast('先在下方选一种已解锁的花种'); return; }
      pot.seed = st.sel; pot.phase = 'grow'; pot.t = 0;
      toast('种下 ' + flowerOf(st.sel).name);
      blip(420, 0.1, 'sine', 0.04);
      return;
    }
    if (pot.phase === 'grow') {
      var g = f.grow / (st.buff.pro > 0 ? 2 : 1);
      toast(f.name + ' 生长中　还需 ' + Math.ceil(g - pot.t) + ' 秒');
      return;
    }
    if (pot.phase === 'bloom') { harvest(i); return; }
    toast(f.name + ' 冷却中　还需 ' + Math.ceil(f.cool - pot.t) + ' 秒');
  }

  /* ---------- HUD ---------- */
  var elPts = document.getElementById('pts');
  var elLv = document.getElementById('lv');
  var elBar = document.getElementById('bar');
  var elNext = document.getElementById('next');
  var btnUp = document.getElementById('btnUp');

  function upCost() { return st.lv >= 10 ? null : LVCOST[st.lv - 1]; }

  function syncHud() {
    elPts.textContent = fmt(st.p);
    elLv.textContent = st.lv;
    var c = upCost();
    if (c === null) {
      elBar.style.width = '100%';
      elNext.textContent = '已满级 · 收益 ×1.2';
      btnUp.textContent = 'Lv.10';
      btnUp.disabled = true;
    } else {
      var prev = st.lv > 1 ? LVCOST[st.lv - 2] : 0;
      var prog = clamp((st.p - prev) / (c - prev), 0, 1);
      elBar.style.width = (prog * 100).toFixed(1) + '%';
      elNext.textContent = '下一级 ' + fmt(c);
      btnUp.textContent = '升级 · ' + fmt(c);
      btnUp.disabled = st.p < c;
    }
  }

  function levelUp() {
    var c = upCost();
    if (c === null || st.p < c) { toast('羽露点还不够，再收一会儿'); return; }
    st.p -= c; st.lv++;
    /* 解锁 */
    var msg = [];
    for (var i = 0; i < BIRDS.length; i++) if (BIRDS[i].lv === st.lv) msg.push(BIRDS[i].name);
    for (var j = 0; j < FLOWERS.length; j++) if (FLOWERS[j].lv === st.lv && FLOWERS[j].price > 0) msg.push(FLOWERS[j].name + '花种');
    if (st.lv === 4) msg.push('第三个花盆');
    if (st.lv === 10) msg.push('全收益 +20%');
    toast('Lv.' + st.lv + '　' + (msg.length ? '解锁 ' + msg.join(' · ') : '收益提升'));
    blip(520, 0.14, 'triangle', 0.05);
    setTimeout(function () { blip(780, 0.22, 'triangle', 0.05); }, 110);
    if (st.lv === 4) st.pots[2] = newPot();
    syncHud(); renderSeeds(); save();
  }

  /* ---------- 花种条 ---------- */
  var elSeeds = document.getElementById('seeds');
  function renderSeeds() {
    elSeeds.innerHTML = '';
    for (var i = 0; i < FLOWERS.length; i++) {
      var f = FLOWERS[i];
      var owned = st.seeds.indexOf(f.id) >= 0;
      var b = document.createElement('button');
      b.className = 'seed' + (owned ? '' : ' lock') + (owned && st.sel === f.id ? ' sel' : '');
      b.innerHTML = '<em style="background:' + (f.id === 'jasmine' || f.id === 'gardenia' ? '#cfc9ae' : f.c) + '"></em>' +
        (owned ? f.name : f.name + '·未解锁');
      if (owned) {
        b.onclick = function (id) {
          return function () { st.sel = id; renderSeeds(); };
        }(f.id);
      }
      elSeeds.appendChild(b);
    }
  }

  /* ---------- 面板 ---------- */
  var panel = document.getElementById('panel');
  var ptitle = document.getElementById('ptitle');
  var psub = document.getElementById('psub');
  var pbody = document.getElementById('pbody');
  var panelOpen = '';

  function closePanel() { panel.classList.remove('open'); panelOpen = ''; sendH(); }

  function openPanel(kind) {
    panelOpen = kind;
    panel.classList.add('open');
    if (kind === 'shop') { ptitle.textContent = '商店'; psub.textContent = 'SHOP'; renderShop(); }
    else { ptitle.textContent = '图鉴'; psub.textContent = 'COLLECTION · ' + (Object.keys(st.coll.birds).length) + '/10 鸟'; renderColl(); }
    sendH();
  }

  function renderShop() {
    var html = '<div class="sect">消耗品</div>';
    for (var i = 0; i < SHOP.length; i++) {
      var s = SHOP[i];
      var lock = st.lv < s.lv, poor = st.p < s.price;
      html += '<div class="row"><div class="nm"><b>' + s.name + '</b><span>' + s.desc + '</span></div>' +
        '<div class="pr">' + s.price + ' P</div>' +
        '<button data-buy="' + s.id + '"' + (lock || poor ? ' disabled' : '') + '>' + (lock ? 'Lv.' + s.lv : '购买') + '</button></div>';
    }
    html += '<div class="sect">花种</div>';
    for (var j = 0; j < FLOWERS.length; j++) {
      var f = FLOWERS[j];
      if (f.price === 0) continue;
      var owned = st.seeds.indexOf(f.id) >= 0;
      var canLv = st.lv >= f.lv;
      html += '<div class="row' + (owned ? ' done' : '') + '"><div class="nm"><b>' + f.name + '</b><span>生长 ' + f.grow + 's · 冷却 ' + f.cool + 's · 收获 ' + f.y + ' P</span></div>' +
        '<div class="pr">' + (owned ? '已拥有' : f.price + ' P') + '</div>' +
        '<button data-seed="' + f.id + '"' + (owned || !canLv || st.p < f.price ? ' disabled' : '') + '>' + (owned ? '✓' : (canLv ? '解锁' : 'Lv.' + f.lv)) + '</button></div>';
    }
    html += '<div class="sect">窗台等级</div>';
    var c = upCost();
    html += '<div class="row"><div class="nm"><b>Lv.' + st.lv + ' → ' + (c === null ? 'MAX' : 'Lv.' + (st.lv + 1)) + '</b><span>羽毛 +8% / 花 +6% / 到访 −5%' + (st.lv >= 10 ? ' · 已享 ×1.2' : '') + '</span></div>' +
      '<div class="pr">' + (c === null ? '—' : c + ' P') + '</div>' +
      '<button id="shopUp"' + (c === null || st.p < c ? ' disabled' : '') + '>升级</button></div>';
    pbody.innerHTML = html;

    pbody.querySelectorAll('[data-buy]').forEach(function (b) {
      b.onclick = function () { buy(b.dataset.buy); };
    });
    pbody.querySelectorAll('[data-seed]').forEach(function (b) {
      b.onclick = function () { buySeed(b.dataset.seed); };
    });
    var su = document.getElementById('shopUp');
    if (su) su.onclick = function () { levelUp(); renderShop(); };
  }

  function buy(id) {
    var s = null;
    for (var i = 0; i < SHOP.length; i++) if (SHOP[i].id === id) s = SHOP[i];
    if (!s || st.lv < s.lv || st.p < s.price) return;
    if (id === 'fert') {
      var target = -1, maxT = 0;
      for (var p = 0; p < activePots(); p++) {
        if (st.pots[p].phase === 'grow' && st.pots[p].t < flowerOf(st.pots[p].seed).grow) {
          var rem = flowerOf(st.pots[p].seed).grow - st.pots[p].t;
          if (rem > maxT) { maxT = rem; target = p; }
        }
      }
      if (target < 0) { toast('现在没有正在生长的花盆'); return; }
      st.pots[target].t += maxT / 2;
      toast('肥料生效　' + flowerOf(st.pots[target].seed).name + ' 生长减半');
    } else if (id === 'pro') {
      st.buff.pro = 60;
      toast('60 秒内所有花盆生长 ×2');
    } else if (id === 'feed') {
      st.buff.feed = 45;
      toast('45 秒内鸟来得更勤');
    } else if (id === 'berry') {
      st.buff.berry = 60;
      toast('60 秒内白头鹎 / 乌鸫更常出现');
    } else if (id === 'worm') {
      st.buff.worm = 60;
      toast('60 秒内白鹡鸰 / 戴胜更常出现');
    }
    st.p -= s.price;
    blip(480, 0.1, 'triangle', 0.04);
    syncHud(); renderShop(); save();
  }

  function buySeed(id) {
    var f = null;
    for (var i = 0; i < FLOWERS.length; i++) if (FLOWERS[i].id === id) f = FLOWERS[i];
    if (!f || st.lv < f.lv || st.p < f.price || st.seeds.indexOf(id) >= 0) return;
    st.p -= f.price;
    st.seeds.push(id);
    st.sel = id;
    toast('解锁 ' + f.name + '　已选中');
    blip(700, 0.16, 'triangle', 0.045);
    syncHud(); renderShop(); renderSeeds(); save();
  }

  function renderColl() {
    var html = '<div class="sect">鸟 · ' + Object.keys(st.coll.birds).length + ' / 10</div><div class="cg">';
    for (var i = 0; i < BIRDS.length; i++) {
      var b = BIRDS[i], got = !!st.coll.birds[b.id];
      html += '<div class="ci ' + (got ? 'got' : 'lock') + '"><i style="background:' + (got ? b.body : 'transparent') + '"></i>' +
        (got ? b.name : '？？？') + '<div style="font-size:9px;color:#8d9480;margin-top:2px">Lv.' + b.lv + ' · ' + b.pts + 'P</div></div>';
    }
    html += '</div><div class="sect">花 · ' + Object.keys(st.coll.flowers).length + ' / 8</div><div class="cg f">';
    for (var j = 0; j < FLOWERS.length; j++) {
      var f = FLOWERS[j], g2 = !!st.coll.flowers[f.id];
      html += '<div class="ci ' + (g2 ? 'got' : 'lock') + '"><i style="background:' + (g2 ? f.c : 'transparent') + '"></i>' +
        (g2 ? f.name : '？？？') + '<div style="font-size:9px;color:#8d9480;margin-top:2px">' + f.y + 'P / 次</div></div>';
    }
    html += '</div><div class="sect">奖励</div>' +
      '<div class="row"><div class="nm"><b>初见某种鸟</b><span>首次拾到该鸟羽毛</span></div><div class="pr">+10 P</div><div style="font-size:11px;color:#6f7a52">' + (Object.keys(st.coll.birds).length ? '进行中' : '—') + '</div></div>' +
      '<div class="row"><div class="nm"><b>初开某种花</b><span>首次收获该花</span></div><div class="pr">+15 P</div><div style="font-size:11px;color:#6f7a52">' + (Object.keys(st.coll.flowers).length ? '进行中' : '—') + '</div></div>' +
      '<div class="row"><div class="nm"><b>集齐 10 种鸟</b><span>一次性奖励</span></div><div class="pr">+200 P</div><div style="font-size:11px;color:' + (st.bonus10 ? '#8a3a22' : '#6f7a52') + '">' + (st.bonus10 ? '已领取' : '未达成') + '</div></div>';
    pbody.innerHTML = html;
  }

  /* ---------- 顶部按钮 ---------- */
  btnUp.onclick = function () { levelUp(); };
  document.getElementById('btnShop').onclick = function () {
    if (panelOpen === 'shop') closePanel(); else openPanel('shop');
  };
  document.getElementById('btnColl').onclick = function () {
    if (panelOpen === 'coll') closePanel(); else openPanel('coll');
  };
  document.getElementById('pclose').onclick = closePanel;

  var btnFast = document.getElementById('btnFast');
  btnFast.onclick = function () {
    st.fast = !st.fast;
    btnFast.classList.toggle('on', st.fast);
    toast(st.fast ? '演示加速 ×3' : '正常速度（到访约 ' + Math.round(interval()) + ' 秒）');
    save();
  };
  btnFast.classList.toggle('on', st.fast);

  var btnSnd = document.getElementById('btnSnd');
  btnSnd.classList.toggle('on', sndOn);
  btnSnd.onclick = function () {
    sndOn = !sndOn;
    st.sound = sndOn;
    btnSnd.classList.toggle('on', sndOn);
    if (sndOn) blip(620, 0.12, 'sine', 0.05);
    save();
  };

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });

  /* ---------- 与父页面同步高度 ---------- */
  function sendH() {
    try {
      var g = document.getElementById('game');
      parent.postMessage({ t: 'wg-h', h: Math.ceil(g.getBoundingClientRect().height + 28) }, '*');
    } catch (e) {}
  }
  window.addEventListener('resize', sendH);

  /* ---------- 启动 ---------- */
  var had = load();

  /* 离线收益：最多 8 小时，按最近收益的 50% */
  (function offline() {
    if (!had) return;
    var gap = (Date.now() - (st.last || Date.now())) / 1000;
    if (gap < 90) return;
    var capped = Math.min(gap, 8 * 3600);
    var gain = Math.floor(capped * Math.max(0.02, st.rate) * 0.5);
    if (gain > 0) {
      st.p += gain;
      setTimeout(function () {
        toast('离开 ' + Math.round(capped / 60) + ' 分钟　带回 ' + fmt(gain) + ' P');
      }, 700);
    }
  })();

  if (had) {
    st.coll = st.coll || { birds: {}, flowers: {} };
    toast('继续上次的窗台 · Lv.' + st.lv);
  } else {
    toast('麻雀快来了 · 点羽毛收 P');
  }

  renderSeeds();
  syncHud();
  nextAt = 3.2;   // 第一只鸟很快到访

  var last = performance.now();
  function loop(now) {
    var dt = Math.min(0.06, (now - last) / 1000);
    last = now;
    tick(dt * (st.fast ? 3 : 1));
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* 调试钩子（便于在控制台查看状态） */
  window.__wg = { st: st, birds: birds, feathers: feathers, spawn: spawnBird, tick: tick, harvest: harvest, BIRDS: BIRDS };

  /* HUD 与存档节拍 */
  setInterval(syncHud, 220);
  setInterval(save, 5000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
  window.addEventListener('beforeunload', save);
  setTimeout(sendH, 60);
  setTimeout(sendH, 600);

  /* 面板打开时不让车轮滚到父页面 */
  panel.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: true });
})();

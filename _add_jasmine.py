# -*- coding: utf-8 -*-
import io, ast

P = r"C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/wingame.html"
rows = ast.literal_eval(io.open(r"C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/_jasmine_js.txt", encoding="utf-8").read())
assert len(rows) == 96 and all(len(r) == 65 for r in rows)

js_rows = ",\n      ".join('"%s"' % r for r in rows)

block = '''  /* ---------- 窗台上的那盆茉莉：来自拼豆图纸，65×96 原格 1:1 ---------- */
  var JASMINE = {
    w: 65, h: 96,
    pal: { a: '#faf6e2', b: '#f2edcf', c: '#d6dba4', d: '#98ac69', e: '#617133', f: '#3c4a22' },
    rows: [
      %s
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

''' % js_rows

s = io.open(P, encoding="utf-8").read()
assert "var JASMINE" not in s
anchor = "  /* ---------- 主绘制 ---------- */"
assert anchor in s
s = s.replace(anchor, block + anchor)

# 画在窗台上：盆底落在台面前缘
old = """    drawDecor();
    for (var i = 0; i < 3; i++) drawPot(i);"""
new = """    if (!JSC) buildJasmine();
    ctx.drawImage(JSC, 173, 54);

    drawDecor();
    for (var i = 0; i < 3; i++) drawPot(i);"""
assert old in s
s = s.replace(old, new)
io.open(P, "w", encoding="utf-8").write(s)
print("ok")

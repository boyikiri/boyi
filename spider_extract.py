# -*- coding: utf-8 -*-
# Extract the perler-bead hanging spider plant from the reference shot,
# downsample it onto the game's pixel grid, and emit a compact JS sprite.
from PIL import Image
import numpy as np, json, io, os

SRC = r"C:\Users\Administrator\Downloads\🪴 拼豆图纸｜复刻一盆会垂下来的小森林_1_二十_来自小红书网页版.jpg"
OUT_JS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_spider_sprite.txt")

im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(int)
H, W = a.shape[:2]
print("src", W, H)

# isolate the plant: the connected component that contains the image centre
import cv2
white = (a[:, :, 0] > 236) & (a[:, :, 1] > 236) & (a[:, :, 2] > 236)
mm = cv2.morphologyEx((~white).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, lab, stats, cent = cv2.connectedComponentsWithStats(mm, 8)
cxh, cyh = W // 2, H // 2
pick = -1
for i in range(1, n):
    bx, by, bw, bh, area = stats[i]
    if bx <= cxh < bx + bw and by <= cyh < by + bh and area > 20000:
        pick = i
print("component", pick, stats[pick])
x0, y0, ww, hh = stats[pick][0], stats[pick][1], stats[pick][2], stats[pick][3]
x1, y1 = x0 + ww - 1, y0 + hh - 1
print("bbox", x0, x1, y0, y1, "->", x1 - x0 + 1, "x", y1 - y0 + 1)

crop = a[y0:y1 + 1, x0:x1 + 1]
ch, cw = crop.shape[:2]

# target grid: keep it a manageable size for the 320x180 canvas
TW = 26
TH = int(round(ch / cw * TW))
print("grid", TW, "x", TH)

# nearest-neighbour downsample
sx = cw / TW
sy = ch / TH
small = np.zeros((TH, TW, 3), int)
for y in range(TH):
    for x in range(TW):
        cy = min(ch - 1, int((y + 0.5) * sy))
        cx = min(cw - 1, int((x + 0.5) * sx))
        # average a small patch around the sample point to avoid bead-hole noise
        py0, py1 = max(0, cy - 1), min(ch, cy + 2)
        px0, px1 = max(0, cx - 1), min(cw, cx + 2)
        small[y, x] = crop[py0:py1, px0:px1].reshape(-1, 3).mean(axis=0)

# 把花盆前面那几道浅色挂绳补成陶土色，26px 下它们会读成一道反光
for y in range(13, 33):
    for x in range(5, 22):
        r, g, b = small[y, x]
        if min(r, g, b) > 145 and (max(r, g, b) - min(r, g, b)) < 50:
            small[y, x] = (204, 144, 72)

# alpha: sample whiteness too
alpha = np.zeros((TH, TW), bool)
for y in range(TH):
    for x in range(TW):
        cy = min(ch - 1, int((y + 0.5) * sy))
        cx = min(cw - 1, int((x + 0.5) * sx))
        r, g, b = small[y, x]
        alpha[y, x] = not (min(r, g, b) > 214 and (max(r, g, b) - min(r, g, b)) < 30)

# palette: k-means-lite via unique quantised colours
from collections import Counter
q = (small // 12 * 12)
cnt = Counter()
for y in range(TH):
    for x in range(TW):
        if not alpha[y, x]:
            continue
        r, g, b = small[y, x]
        if min(r, g, b) > 200 and (max(r, g, b) - min(r, g, b)) < 34:
            continue
        cnt[tuple(q[y, x])] += 1

pal_list = [c for c, _ in cnt.most_common(12)]
print("palette", pal_list)

def nearest(c):
    best, bi = 1e9, 0
    for i, p in enumerate(pal_list):
        d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2
        if d < best:
            best, bi = d, i
    return bi

chars = ".abcdefghijklmnopqrstuvwxyz"
rows = []
for y in range(TH):
    s = ""
    for x in range(TW):
        if not alpha[y, x]:
            s += "."
        else:
            s += chars[nearest(small[y, x])]
    rows.append(s)

pal_js = ",\n    ".join(
    "'%s':'#%02x%02x%02x'" % (chars[i], *p) for i, p in enumerate(pal_list)
)
rows_js = ",\n    ".join("'%s'" % r for r in rows)
out = "var SPIDER = {\n  w: %d, h: %d,\n  pal: {\n    %s\n  },\n  rows: [\n    %s\n  ]\n};\n" % (TW, TH, pal_js, rows_js)
open(OUT_JS, "w", encoding="utf-8").write(out)
print("wrote", OUT_JS, len(out), "bytes")

# preview png for eyeballing
prev = Image.new("RGB", (TW * 8, TH * 8), (255, 255, 255))
for y in range(TH):
    for x in range(TW):
        if alpha[y, x]:
            c = tuple(int(v) for v in small[y, x])
            prev.paste(c, (x * 8, y * 8, x * 8 + 8, y * 8 + 8))
prev.save(os.path.join(os.path.dirname(OUT_JS), "_spider_prev.png"))

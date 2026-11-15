# -*- coding: utf-8 -*-
# Extract the perler-bead gramophone (bottom-left of the sheet) into a game sprite.
# The sheet sits on a dark-green felt, so the object is segmented by hue instead of whiteness.
from PIL import Image
import numpy as np, cv2, os
from collections import Counter

SRC = r"C:\Users\Administrator\Downloads\8色拼豆小图｜复古家具_1_小草莓83n_来自小红书网页版.jpg"
BASE = os.path.dirname(os.path.abspath(__file__))

a = np.asarray(Image.open(SRC).convert("RGB")).astype(int)
H, W = a.shape[:2]
r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
bg = (g > r + 8) & (g > b + 8) & (g < 120)
obj = cv2.morphologyEx((~bg).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, lab, stats, cent = cv2.connectedComponentsWithStats(obj, 8)
best, bd = -1, 1e9
for i in range(1, n):
    x, y, w, h, area = stats[i]
    if area < 20000:
        continue
    d = (x + w / 2 - W * 0.35) ** 2 + (y + h / 2 - H * 0.60) ** 2
    if d < bd:
        bd, best = d, i
x, y, w, h, area = stats[best]
print("pick", best, x, y, w, h)
crop = a[y:y + h, x:x + w]
mask = (lab[y:y + h, x:x + w] == best)
ch, cw = crop.shape[:2]

# 背景底色：取四角 12×12 的中位数
corners = np.concatenate([
    crop[0:12, 0:12].reshape(-1, 3), crop[0:12, -12:].reshape(-1, 3),
    crop[-12:, 0:12].reshape(-1, 3), crop[-12:, -12:].reshape(-1, 3)])
BG = np.median(corners, axis=0)
print("bg", BG)

TW = 32
TH = int(round(ch / cw * TW))
print("grid", TW, TH)

sx, sy = cw / TW, ch / TH
small = np.zeros((TH, TW, 3), int)
alpha = np.zeros((TH, TW), bool)
for yy in range(TH):
    for xx in range(TW):
        cy = min(ch - 1, int((yy + 0.5) * sy))
        cx = min(cw - 1, int((xx + 0.5) * sx))
        py0, py1 = max(0, cy - 1), min(ch, cy + 2)
        px0, px1 = max(0, cx - 1), min(cw, cx + 2)
        patch = crop[py0:py1, px0:px1].reshape(-1, 3)
        col = np.median(patch, axis=0)
        small[yy, xx] = col
        # 与绿绒底色的最大通道差决定实心与否（比「偏绿」判据稳，暗红边不会被吃掉）
        d = np.abs(col - BG).max()
        alpha[yy, xx] = d > 26

# 只保留与主体连通的部分，去掉边缘碎屑
am = alpha.astype(np.uint8)
nn, ll, ss, cc = cv2.connectedComponentsWithStats(am, 8)
if nn > 1:
    keep = 1 + int(np.argmax(ss[1:, 4]))
    alpha = (ll == keep)

q = (small // 12 * 12)
cnt = Counter()
for yy in range(TH):
    for xx in range(TW):
        if alpha[yy, xx]:
            cnt[tuple(q[yy, xx])] += 1
pal_list = []
for c, _ in cnt.most_common(24):
    if c[1] > c[0] - 2 and c[1] > c[2] + 6:      # 绿绒色不进调色板
        continue
    pal_list.append(c)
    if len(pal_list) == 12:
        break
print("palette", len(pal_list))

def nearest(c):
    bi, bd2 = 0, 1e9
    for i, p in enumerate(pal_list):
        d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2
        if d < bd2:
            bd2, bi = d, i
    return bi

chars = ".abcdefghijklmnopqrstuvwxyz"
rows = []
for yy in range(TH):
    s = ""
    for xx in range(TW):
        s += "." if not alpha[yy, xx] else chars[nearest(small[yy, xx])]
    rows.append(s)

pal_js = ",\n    ".join("'%s':'#%02x%02x%02x'" % (chars[i], *p) for i, p in enumerate(pal_list))
rows_js = ",\n    ".join("'%s'" % s for s in rows)
out = "var GRAMO_SP = {\n  w: %d, h: %d,\n  pal: {\n    %s\n  },\n  rows: [\n    %s\n  ]\n};\n" % (TW, TH, pal_js, rows_js)
open(os.path.join(BASE, "_gramo_sprite.txt"), "w", encoding="utf-8").write(out)
print("wrote", len(out))

prev = Image.new("RGB", (TW * 10, TH * 10), (255, 255, 255))
for yy in range(TH):
    for xx in range(TW):
        if alpha[yy, xx]:
            prev.paste(tuple(int(v) for v in small[yy, xx]), (xx * 10, yy * 10, xx * 10 + 10, yy * 10 + 10))
prev.save(os.path.join(BASE, "_gramo_prev.png"))

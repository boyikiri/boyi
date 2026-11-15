# -*- coding: utf-8 -*-
"""把拼豆图纸按格子还原成像素图"""
from PIL import Image
import numpy as np

im = Image.open(r"C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/_ref_jasmine.jpg").convert("RGB")
a = np.array(im).astype(np.float32)

P = 8.723
X0, Y0 = 257.0, 299.0
COLS, ROWS = 65, 96

mx = a.max(axis=2) / 255
mn = a.min(axis=2) / 255
sat = (mx - mn) / np.maximum(mx, 1e-6)
mask = (sat > 0.17) | (mx > 0.94)

cells = np.zeros((ROWS, COLS, 4), np.uint8)
for j in range(ROWS):
    for i in range(COLS):
        cx = X0 + (i + 0.5) * P
        cy = Y0 + (j + 0.5) * P
        x, y = int(round(cx)), int(round(cy))
        if y < 0 or y >= a.shape[0] or x < 0 or x >= a.shape[1]:
            continue
        patch = a[y - 1:y + 2, x - 1:x + 2].reshape(-1, 3)
        col = np.median(patch, axis=0)
        fill = mask[y - 2:y + 3, x - 2:x + 3].mean()
        if fill < 0.55:
            continue
        cells[j, i, :3] = col.astype(np.uint8)
        cells[j, i, 3] = 255

# 量化到 10 色：只在有内容的像素上做
opaque = cells[..., 3] > 0
pix = cells[opaque][:, :3]
tmp = Image.fromarray(pix.reshape(-1, 1, 3)).quantize(colors=10, method=Image.MEDIANCUT)
pal = np.array(tmp.getpalette()[:30], np.uint8).reshape(10, 3)
idx = np.array(tmp).reshape(-1)
cells[opaque, :3] = pal[idx]

out = Image.fromarray(cells, "RGBA")
out.save(r"C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/_jasmine_grid.png")
out.resize((COLS * 8, ROWS * 8), Image.NEAREST).save(
    r"C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/_jasmine_grid_8x.png")

print("cells", int(opaque.sum()), "palette:")
for c in pal:
    print("  #%02x%02x%02x" % tuple(c))

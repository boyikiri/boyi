# -*- coding: utf-8 -*-
"""目录页左侧背景：庞贝女神·花神像
   把封面那张壁画调成“同一面粉墙上的旧画”，右缘渐隐，做成可叠在网格背后的底纹。
"""
from PIL import Image, ImageEnhance, ImageChops, ImageFilter

SRC = "goddess_cover.jpg"
WALL = "bg-turquoise.jpg"
OUT = "goddess_side.webp"


def grad(w, h, stops, vertical=False):
    """按 stops(t)->0..1 生成线性渐变遮罩"""
    n = h if vertical else w
    line = Image.new("L", (1, n) if vertical else (n, 1))
    px = line.load()
    for i in range(n):
        v = int(round(255 * max(0.0, min(1.0, stops(i / max(1, n - 1))))))
        if vertical:
            px[0, i] = v
        else:
            px[i, 0] = v
    return line.resize((w, h))


def smooth(a, b, t):
    if t <= a:
        return 0.0
    if t >= b:
        return 1.0
    k = (t - a) / (b - a)
    return k * k * (3 - 2 * k)


src = Image.open(SRC).convert("RGB")
w, h = src.size
# 人物偏左中，去掉最外圈的墙面噪点
crop = src.crop((int(w * 0.03), int(h * 0.02), int(w * 0.96), int(h * 0.985)))

# 1) 先压掉原图的艳青，让它退成旧壁画的浓度
im = ImageEnhance.Color(crop).enhance(0.72)
im = ImageEnhance.Contrast(im).enhance(0.99)
im = ImageEnhance.Brightness(im).enhance(1.03)

# 2) 掺入本站墙面的底色与纸纹，色相统一
wall = Image.open(WALL).convert("RGB")
tw, th = im.size
tile = Image.new("RGB", (tw, th))
for x in range(0, tw, wall.width):
    for y in range(0, th, wall.height):
        tile.paste(wall, (x, y))
im = Image.blend(im, tile, 0.26)

# 3) 右缘长距离渐隐、上下轻收，落在纸面上不留硬边
mh = grad(tw, th, lambda t: 1.0 - smooth(0.30, 0.99, t))
mv = grad(tw, th, lambda t: smooth(0.0, 0.10, t) * (1.0 - smooth(0.86, 1.0, t)), vertical=True)
mask = ImageChops.multiply(mh, mv).filter(ImageFilter.GaussianBlur(2.5))

# 4) 整体浓度压到 0.60，保证便签上的字仍然压得住
mask = mask.point(lambda v: int(v * 0.62))
out = im.convert("RGBA")
out.putalpha(mask)
out = out.resize((int(out.width * 1100 / out.height), 1100), Image.LANCZOS)
out.save(OUT, quality=90, method=6)
print(OUT, im.size)

# 预览：把底纹按页面比例贴在墙纸上
pv = Image.new("RGB", (760, 900), (120, 171, 164))
wall2 = tile.resize((760, 900))
pv.paste(wall2)
art = Image.open(OUT)
art = art.resize((int(art.width * 900 / art.height), 900), Image.LANCZOS)
pv.paste(art, (-int(art.width * 0.10), 0), art)
pv.save("_gs_preview.png")

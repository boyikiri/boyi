# -*- coding: utf-8 -*-
"""给透明人像加“撕纸白边”：沿轮廓向外生成不规则毛边的白色纸层。"""
from PIL import Image, ImageFilter, ImageChops

SRC = "portrait.png"
DST = "portrait_paper.png"

PAD = 64
src = Image.open(SRC).convert("RGBA")
im = Image.new("RGBA", (src.width + PAD * 2, src.height + PAD * 2), (0, 0, 0, 0))
im.alpha_composite(src, (PAD, PAD))
w, h = im.size
A = im.split()[-1]

field = A.filter(ImageFilter.GaussianBlur(30))

n1 = Image.effect_noise((max(2, w // 46), max(2, h // 46)), 62).resize((w, h), Image.BICUBIC)
n2 = Image.effect_noise((max(2, w // 14), max(2, h // 14)), 52).resize((w, h), Image.BICUBIC)
n3 = Image.effect_noise((max(2, w // 4), max(2, h // 4)), 40).resize((w, h), Image.BICUBIC)

fp = field.load()
a1, a2, a3 = n1.load(), n2.load(), n3.load()

BASE = 22           # 阈值越低，白边越宽
AMP = 0.82

paper = Image.new("L", (w, h), 0)
pp = paper.load()
ap_ = A.load()
for y in range(h):
    for x in range(w):
        v = fp[x, y]
        if v < 16:
            if ap_[x, y]:
                pp[x, y] = 255
            continue
        noise = a1[x, y] * 0.55 + a2[x, y] * 0.32 + a3[x, y] * 0.13
        t = BASE + (noise - 128) * AMP
        pp[x, y] = 255 if (v > t or ap_[x, y] > 8) else 0

paper = paper.filter(ImageFilter.MedianFilter(3))
paper_soft = paper.filter(ImageFilter.GaussianBlur(0.8))

# 纸面：近白 + 极轻纸纹（比页面底色亮，能看出是一张纸）
sheet = Image.effect_noise((w, h), 12).filter(ImageFilter.GaussianBlur(0.5))
sheet = sheet.point(lambda v: 252 + int((v - 128) * 0.05))
r = sheet
g = sheet.point(lambda v: v - 2)
b = sheet.point(lambda v: v - 6)
paper_rgb = Image.merge("RGB", (r, g, b))

# 撕口的暗边：纸片向内 3px 的缘强化，制造纸纤维的厚度感
inner = paper.filter(ImageFilter.MinFilter(7))            # 向内收缩
rim = ImageChops.subtract(paper, inner).filter(ImageFilter.GaussianBlur(1.2))
rim = rim.point(lambda v: int(v * 0.55))
dark = Image.new("RGB", (w, h), (196, 188, 174))
paper_rgb = Image.composite(dark, paper_rgb, rim)

# 投影
shadow_mask = paper.filter(ImageFilter.GaussianBlur(16)).point(lambda v: int(v * 0.42))
shadow = Image.new("RGBA", (w, h), (54, 48, 40, 255))
shadow.putalpha(shadow_mask)

canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
canvas.alpha_composite(shadow, (2, 9))

layer = paper_rgb.convert("RGBA")
layer.putalpha(paper_soft)
canvas.alpha_composite(layer)

canvas.alpha_composite(im.copy())

canvas.save(DST)
print("saved", DST, canvas.size)

# -*- coding: utf-8 -*-
"""技能图标 -> 复古丝网印刷质感（最终版）
流程: 动态范围归一化 -> 固定阈值分 4 阶 -> 复古油墨色阶 -> 墨色不匀 + 网点
      -> 边缘套印错位 -> 极细印版框线
原图备份在 icon-backup/，可随时回滚。
"""
import os
import shutil
from PIL import Image, ImageDraw, ImageChops, ImageFilter

SRC = os.path.dirname(os.path.abspath(__file__))
BK = os.path.join(SRC, "icon-backup")
PAPER = (245, 240, 229)

FILES = ["icon-pr.png", "icon-ai.png", "icon-ps.png", "icon-canva.png",
         "icon-gpt.png", "icon-capcut.png", "icon-shimo.png", "icon-mysql.png"]

# 复古油墨四阶（深 -> 浅），浅阶取纸色，形成"白字即露纸"的丝网感
RAMPS = {
    "warm":    [(76, 56, 42), (154, 86, 58), (196, 156, 110), (238, 229, 209)],
    "cool":    [(50, 62, 72), (92, 120, 120), (166, 180, 170), (238, 231, 213)],
    "green":   [(50, 62, 52), (104, 126, 104), (170, 182, 156), (238, 231, 211)],
    "plum":    [(58, 44, 54), (124, 98, 112), (186, 166, 168), (238, 229, 215)],
    "neutral": [(56, 54, 48), (122, 116, 102), (182, 174, 154), (238, 232, 216)],
}
TH = [72, 132, 192]         # 四阶阈值
DOT_PERIOD, DOT_R, DOT_DARK = 7, 1.9, 249
MOTTLE = 12                 # 墨色不匀强度
GHOST = 0.40                # 套印错位强度
SOFT0 = 0.22                # 最深处透出一点纸色

# 原本是浅底的图标要翻转色阶，让底成墨、字形露纸，八张才成套
FLIP = {"icon-capcut.png", "icon-shimo.png", "icon-mysql.png"}


def solid(size, rgb):
    return Image.new("RGB", size, rgb)


def pick_ramp(im):
    avg = im.convert("RGB").resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    h, s, v = Image.new("RGB", (1, 1), avg).convert("HSV").getpixel((0, 0))
    if s < 40:
        return "neutral"
    if h < 52 or h > 226:
        return "warm"
    if 52 <= h < 100:
        return "green"
    if 100 <= h < 196:
        return "cool"
    return "plum"


def stretch(gray, lo_f=0.03, hi_f=0.97):
    hist, total, acc = gray.histogram(), sum(gray.histogram()), 0

    def q(f):
        acc, i, t = 0, 0, total * f
        while i < 256 and acc + hist[i] < t:
            acc += hist[i]
            i += 1
        return i

    lo, hi = q(lo_f), q(hi_f)
    if hi - lo < 24:
        lo, hi = 0, 255
    return gray.point(lambda v: max(0, min(255, int((v - lo) * 255.0 / (hi - lo)))))


def dots(size, period, r, dark):
    tile = Image.new("L", (period, period), 255)
    d = ImageDraw.Draw(tile)
    c = period // 2
    d.ellipse([c - r, c - r, c + r, c + r], fill=dark)
    big = Image.new("L", size, 255)
    for y in range(0, size[1], period):
        for x in range(0, size[0], period):
            big.paste(tile, (x, y))
    return big


def mottle(size, amt):
    small = Image.effect_noise((9, 9), 44).resize(size, Image.BICUBIC)
    lo = 255 - amt
    return small.point(lambda v: int(lo + v * amt / 255.0))


def keyline(img, color, alpha=120, width=3, radius=10, inset=3):
    """极细印版框线，让米色底的图标也能立住"""
    size = img.size
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([inset, inset, size[0] - 1 - inset, size[1] - 1 - inset],
                        radius=radius, outline=int(alpha), width=width)
    layer = Image.new("RGBA", size, color + (255,))
    layer.putalpha(mask)
    return Image.alpha_composite(img.convert("RGBA"), layer)


def process(im, flip=False):
    size = im.size
    rgb = im.convert("RGB")
    gray = stretch(rgb.convert("L"), 0.03, 0.97)

    ramp = RAMPS[pick_ramp(rgb)]
    tinted = []
    for i, c in enumerate(ramp):
        f = SOFT0 if i == 0 else 0.0
        tinted.append(tuple(int(c[k] * (1 - f) + PAPER[k] * f) for k in range(3)))

    src, out = gray.load(), Image.new("RGB", size)
    dst = out.load()
    for y in range(size[1]):
        for x in range(size[0]):
            v = src[x, y]
            i = 0 if v < TH[0] else 1 if v < TH[1] else 2 if v < TH[2] else 3
            dst[x, y] = tinted[3 - i if flip else i]

    # 墨色不匀 + 网点
    out = ImageChops.multiply(out, Image.merge("RGB", (mottle(size, MOTTLE),) * 3))
    out = ImageChops.multiply(out, Image.merge("RGB", (dots(size, DOT_PERIOD, DOT_R, DOT_DARK),) * 3))

    # 套印错位：只在边缘拉一点朱红虚影
    edges = gray.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.0))
    edges = edges.point(lambda x: min(255, int(x * 2.6 * GHOST)))
    shifted = out.transform(size, Image.AFFINE, (1, 0, -2, 0, 1, -1), resample=Image.NEAREST)
    ghost = Image.blend(shifted, solid(size, (186, 52, 40)), 0.45)
    out = Image.composite(ghost, out, edges.point(lambda x: int(x * GHOST)))

    out = out.convert("RGBA")
    out.putalpha(im.split()[3])
    return keyline(out, ramp[1], alpha=120, width=3, radius=10, inset=3)


def main():
    os.makedirs(BK, exist_ok=True)
    for name in FILES:
        path = os.path.join(SRC, name)
        bk = os.path.join(BK, name)
        if not os.path.exists(bk):
            shutil.copy2(path, bk)
        im = Image.open(bk).convert("RGBA")
        process(im, flip=name in FLIP).save(path)
        print("done:", name)


if __name__ == "__main__":
    main()

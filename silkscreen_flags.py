# -*- coding: utf-8 -*-
"""语言技能的三面旗帜 -> 复古丝网印刷质感
与技能图标同一套工序，但保留色相（三色旗靠色块识别，不能走亮度分阶）。
原图备份在 lang-backup/
"""
import os
import shutil
from PIL import Image, ImageDraw, ImageChops, ImageFilter

SRC = os.path.dirname(os.path.abspath(__file__))
BK = os.path.join(SRC, "lang-backup")
PAPER = (245, 240, 229)
FILES = ["lang-en.png", "lang-jp.png", "lang-fr.png"]

SAT = 0.44          # 饱和度保留
V_LO, V_HI = 24, 230
NCOL = 5            # 分色数
CREAM = 0.08        # 纸色融合
DOT_PERIOD, DOT_R, DOT_DARK = 6, 1.5, 248
MOTTLE = 13
GHOST = 0.42
INK = (92, 84, 70)  # 印版框线色


def solid(size, rgb):
    return Image.new("RGB", size, rgb)


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


def keyline(img, color, alpha=95, width=3, radius=10, inset=3):
    size = img.size
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([inset, inset, size[0] - 1 - inset, size[1] - 1 - inset],
                        radius=radius, outline=alpha, width=width)
    layer = Image.new("RGBA", size, color + (255,))
    layer.putalpha(mask)
    return Image.alpha_composite(img.convert("RGBA"), layer)


def process(im):
    size = im.size
    rgb = im.convert("RGB")

    # 压饱和 + 把明度收进印刷区间（保留色相）
    hsv = rgb.convert("HSV")
    h, s, v = hsv.split()
    s = s.point(lambda x: int(x * SAT))
    v = v.point(lambda x: int(V_LO + x * (V_HI - V_LO) / 255.0))
    rgb = Image.merge("HSV", (h, s, v)).convert("RGB")

    # 限量分色 + 纸色融合
    rgb = rgb.quantize(NCOL, method=Image.MEDIANCUT).convert("RGB")
    rgb = Image.blend(rgb, solid(size, PAPER), CREAM)

    # 墨色不匀 + 网点
    rgb = ImageChops.multiply(rgb, Image.merge("RGB", (mottle(size, MOTTLE),) * 3))
    rgb = ImageChops.multiply(rgb, Image.merge("RGB", (dots(size, DOT_PERIOD, DOT_R, DOT_DARK),) * 3))

    # 套印错位（边缘朱红虚影）
    gray = rgb.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.0))
    edges = edges.point(lambda x: min(255, int(x * 2.6 * GHOST)))
    shifted = rgb.transform(size, Image.AFFINE, (1, 0, -2, 0, 1, -1), resample=Image.NEAREST)
    ghost = Image.blend(shifted, solid(size, (186, 52, 40)), 0.45)
    rgb = Image.composite(ghost, rgb, edges.point(lambda x: int(x * GHOST)))

    return keyline(rgb, INK, alpha=95, width=3, radius=10, inset=3)


def main():
    os.makedirs(BK, exist_ok=True)
    for name in FILES:
        path = os.path.join(SRC, name)
        bk = os.path.join(BK, name)
        if not os.path.exists(bk):
            shutil.copy2(path, bk)
        im = Image.open(bk).convert("RGBA")
        out = process(im)
        a = im.split()[3]
        out.putalpha(a if a.getextrema()[0] < 250 else Image.new("L", im.size, 255))
        out.save(path)
        print("done:", name)


if __name__ == "__main__":
    main()

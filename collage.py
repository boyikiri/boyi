# -*- coding: utf-8 -*-
"""先抠出主体，再沿主体轮廓做撕纸描边（不加纸底）"""
import random
from PIL import Image, ImageDraw, ImageFilter, ImageChops

DL = "C:/Users/Administrator/Downloads/"
OUT = "C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/"

SRC = {
    "pin":    ("古早风拼贴_素材分享_2_犯困蛋挞_素材铺_来自小红书网页版.jpg", "black", 44),
    "camera": ("【素材积累】📸_1_Vievje_来自小红书网页版.jpg", "white", 30),
    "rose":   ("手帐素材｜拼贴风报纸边框素材（多图）_1_小能人素材_来自小红书网页版.jpg", "black", 40),
    "bulb":   ("古早风拼贴_素材分享_7_犯困蛋挞_素材铺_来自小红书网页版.jpg", "black", 44),
}

random.seed(5)


def prune(mask, rel_keep=0.02):
    """去掉与主体不相连的碎屑（水印、杂点）"""
    w, h = mask.size
    sc = 3
    small = mask.resize((max(1, w // sc), max(1, h // sc)), Image.BOX).point(lambda v: 1 if v > 120 else 0)
    sw, sh = small.size
    px = small.load()
    seen = [[False] * sw for _ in range(sh)]
    comps = []
    for sy in range(sh):
        for sx in range(sw):
            if px[sx, sy] and not seen[sy][sx]:
                stack = [(sx, sy)]
                seen[sy][sx] = True
                comp = []
                while stack:
                    cx, cy = stack.pop()
                    comp.append((cx, cy))
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < sw and 0 <= ny < sh and px[nx, ny] and not seen[ny][nx]:
                            seen[ny][nx] = True
                            stack.append((nx, ny))
                comps.append(comp)
    if not comps:
        return mask
    biggest = max(len(c) for c in comps)
    thresh = max(6, int(biggest * rel_keep))
    keep = Image.new("L", (sw, sh), 0)
    kp = keep.load()
    for comp in comps:
        if len(comp) >= thresh:
            for cx, cy in comp:
                kp[cx, cy] = 255
    keep = keep.resize((w, h), Image.LANCZOS).point(lambda v: 255 if v > 110 else 0)
    return ImageChops.multiply(mask, keep)


def cut_bg(im, thresh):
    """从四边泛洪去掉纯色底，得到主体蒙版"""
    im = im.convert("RGB")
    w, h = im.size
    key = (255, 0, 255)
    flood = im.copy()
    seeds = [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2),
             (w // 2, 1), (w // 2, h - 2), (1, h // 2), (w - 2, h // 2),
             (w // 4, 1), (3 * w // 4, h - 2), (w // 4, h - 2), (3 * w // 4, 1),
             (w // 8, h // 8), (7 * w // 8, h // 8), (w // 8, 7 * h // 8), (7 * w // 8, 7 * h // 8)]
    for s in seeds:
        try:
            ImageDraw.floodfill(flood, s, key, thresh=thresh)
        except Exception:
            pass
    r, g, b = flood.split()
    bg = ImageChops.multiply(ImageChops.multiply(r.point(lambda v: 255 if v == 255 else 0),
                                                 g.point(lambda v: 255 if v == 0 else 0)),
                             b.point(lambda v: 255 if v == 255 else 0))
    mask = ImageChops.invert(bg)
    mask = prune(mask)
    mask = mask.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(0.9))
    mask = mask.point(lambda v: 255 if v > 120 else 0)
    return im.convert("RGBA"), mask


def flatten_checker(im, thresh=206):
    """素材 7 的玻璃区被烘成了棋盘格：高亮低饱和区压成低频柔光"""
    rgb = im.convert("RGB")
    w, h = rgb.size
    low = rgb.resize((max(2, w // 44), max(2, h // 44)), Image.LANCZOS).resize((w, h), Image.BICUBIC)
    low = Image.blend(low, Image.new("RGB", (w, h), (250, 246, 236)), 0.45)
    r, g, b = rgb.split()
    mx = ImageChops.lighter(ImageChops.lighter(r, g), b)
    mn = ImageChops.darker(ImageChops.darker(r, g), b)
    sat = ImageChops.subtract(mx, mn)
    bright = rgb.convert("L").point(lambda v: 255 if v > thresh else 0)
    neutral = sat.point(lambda v: 255 if v < 36 else 0)
    m = ImageChops.multiply(bright, neutral).filter(ImageFilter.GaussianBlur(2.2))
    out = Image.composite(low, rgb, m).convert("RGBA")
    out.putalpha(im.split()[-1])
    return out


def build(key, width, stroke=11, alpha=0.34):
    fn, kind, thr = SRC[key]
    im, mask = cut_bg(Image.open(DL + fn), thr)

    bbox = mask.getbbox()
    box = (max(0, bbox[0] - 4), max(0, bbox[1] - 4),
           min(im.width, bbox[2] + 4), min(im.height, bbox[3] + 4))
    im = im.crop(box)
    mask = mask.crop(box)

    s = width / im.width
    nw, nh = max(8, int(im.width * s)), max(8, int(im.height * s))
    im = im.resize((nw, nh), Image.LANCZOS)
    mask = mask.resize((nw, nh), Image.LANCZOS).point(lambda v: 255 if v > 110 else 0)

    if key == "bulb":
        im = flatten_checker(im)

    m = int(stroke * 3.2) + 6
    W, H = nw + m * 2, nh + m * 2
    body = Image.new("RGB", (W, H), (0, 0, 0))
    body.paste(im.convert("RGB"), (m, m))
    full = Image.new("L", (W, H), 0)
    full.paste(mask, (m, m))

    # 沿轮廓外扩出撕纸边：模糊场的等值线 + 纸纤维扰动
    sig = max(2.2, stroke / 1.55)
    field = full.filter(ImageFilter.GaussianBlur(sig))
    fib = Image.effect_noise((max(2, int(W / 1.6)), max(2, int(H / 1.6))), 82).resize((W, H), Image.BICUBIC)
    fib = fib.filter(ImageFilter.GaussianBlur(0.3))
    fib2 = Image.effect_noise((max(2, W // 9), max(2, H // 9)), 62).resize((W, H), Image.BICUBIC)
    tex = ImageChops.blend(fib, fib2, 0.3)

    th = tex.point(lambda v: max(4, min(96, int(20 + (v - 128) * 0.42))))
    outer = ImageChops.subtract(field, th).point(lambda v: 255 if v > 0 else 0)
    outer = ImageChops.lighter(outer, full)
    outer = outer.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(0.3))

    ring = ImageChops.subtract(outer, full.filter(ImageFilter.MinFilter(3)))
    ring = ring.filter(ImageFilter.GaussianBlur(0.4))

    res = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (W, H), (26, 30, 20, 255))
    shadow.putalpha(outer.filter(ImageFilter.GaussianBlur(stroke * 1.3)).point(lambda v: int(v * alpha)))
    res.alpha_composite(shadow, (2, 6))

    layer = body.convert("RGBA")
    layer.putalpha(full)
    res.alpha_composite(layer)

    paper = Image.new("RGBA", (W, H), (251, 247, 237, 255))
    paper.putalpha(ring)
    res.alpha_composite(paper)

    bb = res.split()[-1].getbbox()
    res = res.crop((max(0, bb[0] - 6), max(0, bb[1] - 6), min(W, bb[2] + 6), min(H, bb[3] + 6)))
    res.save(OUT + "scrap-%s.png" % key)
    print("scrap-%s.png" % key, res.size)


if __name__ == "__main__":
    build("pin", 620, stroke=10)
    build("camera", 520, stroke=10)
    build("rose", 430, stroke=9)

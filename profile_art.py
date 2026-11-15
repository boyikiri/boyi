# -*- coding: utf-8 -*-
"""把两张山西照片做成：黑白 + 抠出主体 + 撕纸白边，用作“个人简介”的背景素材。"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops

A = "C:/Users/Administrator/Downloads/晋祠｜绝对是最美侍女像，可惜拍不到了_1_聪_来自小红书网页版.jpg"
B = "C:/Users/Administrator/Downloads/以为景点的审美都完蛋了，直到我去了山西_1_七七漫行地球📷_来自小红书网页版.jpg"
OUT = "C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/"

# 侍女像：手工描的轮廓（400x542 预览坐标）
POLY_A = [(72,46),(120,28),(196,26),(232,44),(244,96),(238,150),(232,196),
          (258,232),(288,300),(318,392),(330,470),(336,542),(58,542),
          (48,470),(52,392),(66,318),(92,252),(72,190),(56,120)]


def gray(im, gamma=0.80, lift=16):
    """提亮的黑白转换：抬中间调、保高光，避免暗部糊成一片"""
    g = im.convert("L")
    return g.point(lambda v: max(0, min(255, int(255 * ((v / 255) ** gamma) + lift))))


def ragged_bottom(mask, w, h, depth=10, amp=9):
    """底部做不规则撕口，避免一刀切的直线"""
    n = Image.effect_noise((max(4, w // 6), 1), 70).resize((w, 2), Image.BICUBIC)
    npv = n.load()
    mp = mask.load()
    for x in range(w):
        cut = h - depth + int((npv[x, 0] - 128) * amp / 128)
        for y in range(max(0, cut), h):
            mp[x, y] = 0
    return mask


def paper_effect(subject, pad_ratio=0.14):
    w, h = subject.size
    PAD = int(w * pad_ratio)
    canvas = Image.new("RGBA", (w + PAD * 2, h + PAD * 2), (0, 0, 0, 0))
    canvas.alpha_composite(subject, (PAD, PAD))
    W, H = canvas.size
    Al = canvas.split()[-1]
    field = Al.filter(ImageFilter.GaussianBlur(max(10, int(w / 26))))

    n1 = Image.effect_noise((max(2, W // 46), max(2, H // 46)), 62).resize((W, H), Image.BICUBIC)
    n2 = Image.effect_noise((max(2, W // 14), max(2, H // 14)), 52).resize((W, H), Image.BICUBIC)
    n3 = Image.effect_noise((max(2, W // 4), max(2, H // 4)), 40).resize((W, H), Image.BICUBIC)

    fp = field.load(); a1, a2, a3 = n1.load(), n2.load(), n3.load(); ap = Al.load()
    BASE = max(6, int(w * 0.015))
    paper = Image.new("L", (W, H), 0); pp = paper.load()
    for y in range(H):
        for x in range(W):
            if ap[x, y]:
                pp[x, y] = 255
                continue
            v = fp[x, y]
            if v < 6:
                continue
            noise = a1[x, y] * 0.55 + a2[x, y] * 0.32 + a3[x, y] * 0.13
            pp[x, y] = 255 if v > BASE + (noise - 128) * 0.82 else 0

    paper = paper.filter(ImageFilter.MedianFilter(3))
    paper_soft = paper.filter(ImageFilter.GaussianBlur(0.7))

    sheet = Image.effect_noise((W, H), 12).filter(ImageFilter.GaussianBlur(0.5))
    sheet = sheet.point(lambda v: 252 + int((v - 128) * 0.05))
    paper_rgb = Image.merge("RGB", (sheet, sheet.point(lambda v: v - 2), sheet.point(lambda v: v - 6)))

    inner = paper.filter(ImageFilter.MinFilter(7))
    rim = ImageChops.subtract(paper, inner).filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: int(v * 0.5))
    paper_rgb = Image.composite(Image.new("RGB", (W, H), (198, 190, 176)), paper_rgb, rim)

    shadow_mask = paper.filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * 0.38))
    shadow = Image.new("RGBA", (W, H), (40, 48, 32, 255))
    shadow.putalpha(shadow_mask)

    res = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    res.alpha_composite(shadow, (1, 7))
    layer = paper_rgb.convert("RGBA"); layer.putalpha(paper_soft)
    res.alpha_composite(layer)
    res.alpha_composite(canvas)
    return res


def build_poly(src, poly, base, out_w, name):
    im = Image.open(src).convert("RGB")
    h = int(round(out_w * im.height / im.width))
    im = im.resize((out_w, h), Image.LANCZOS)
    g = gray(im)
    iso = Image.merge("RGB", (g, g, g.point(lambda v: max(0, v - 1))))

    sx, sy = out_w / base[0], h / base[1]
    pts = [(x * sx, y * sy) for x, y in poly]
    mask = Image.new("L", (out_w, h), 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.0))
    mask = ragged_bottom(mask, out_w, h, depth=int(h * 0.018), amp=10)

    subject = iso.convert("RGBA"); subject.putalpha(mask)
    res = paper_effect(subject)
    res.save(OUT + name)
    print("saved", name, res.size)


def build_rowmodel(src, crop, out_w, name, tol=34):
    """用每行两侧的取样估计背景（天空/墙面），抠出主体"""
    im = Image.open(src).convert("RGB")
    if crop:
        im = im.crop(crop)
    h = int(round(out_w * im.height / im.width))
    im = im.resize((out_w, h), Image.LANCZOS)
    w = out_w
    px = im.load()

    band = max(6, w // 40)
    rowbg = []
    for y in range(h):
        s = [px[x, y] for x in list(range(0, band)) + list(range(w - band, w))]
        n = len(s)
        rowbg.append(tuple(sum(v[i] for v in s) // n for i in range(3)))

    mask = Image.new("L", (w, h), 0); mk = mask.load()
    for y in range(h):
        br, bg_, bb = rowbg[y]
        for x in range(w):
            r, g, b = px[x, y]
            if abs(r - br) + abs(g - bg_) + abs(b - bb) > tol * 3:
                mk[x, y] = 255

    mask = mask.filter(ImageFilter.MedianFilter(5))
    mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    mask = mask.filter(ImageFilter.MedianFilter(3))
    mask = ragged_bottom(mask, w, h, depth=int(h * 0.01), amp=8)

    g = gray(im)
    iso = Image.merge("RGB", (g, g, g.point(lambda v: max(0, v - 1))))
    subject = iso.convert("RGBA"); subject.putalpha(mask)
    res = paper_effect(subject, pad_ratio=0.13)
    res.save(OUT + name)
    print("saved", name, res.size)


if __name__ == "__main__":
    build_poly(A, POLY_A, (400, 542), 470, "arch-jinci.png")
    build_rowmodel(B, (0, 0, 1080, 1050), 560, "arch-pingyao.png", tol=32)

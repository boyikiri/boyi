# -*- coding: utf-8 -*-
"""从便签素材图里抠出 6 张便签，转灰度、加投影，输出统一画布的 PNG"""
from PIL import Image, ImageFilter, ImageChops, ImageDraw, ImageStat

SRC = "C:/Users/Administrator/Downloads/设计素材 _ 便签纸_1_灵感加载中✨_来自小红书网页版.jpg"
OUT = "C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/"

CW, CH = 520, 470          # 统一画布
FILL = 0.82                # 便签占画布的比例

CELLS = [(0, 0), (1, 0), (0, 1), (1, 1), (0, 2), (1, 2)]   # (col, row)


def alpha_of(im):
    """用饱和度区分：背景与投影是中性色，便签都带一点色"""
    hsv = im.convert("HSV")
    s = hsv.split()[1]
    a = s.point(lambda v: 0 if v <= 16 else (255 if v >= 26 else int((v - 16) * 25.5)))
    a = a.filter(ImageFilter.MedianFilter(5))
    a = a.point(lambda v: 255 if v >= 128 else 0)

    # 填内洞：从四角把外部标出来，剩下没被标到的 0 就是内部空洞
    w, h = a.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if a.getpixel(seed) == 0:
            ImageDraw.floodfill(a, seed, 128)
    a = a.point(lambda v: 255 if v != 128 else 0)

    # 去碎点：保留最大连通块
    return largest(a)


def largest(a):
    w, h = a.size
    px = a.load()
    best = None
    seen = set()
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            if px[x, y] > 128 and (x, y) not in seen:
                stack = [(x, y)]
                cells = []
                seen.add((x, y))
                while stack:
                    cx, cy = stack.pop()
                    cells.append((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny] > 128:
                            seen.add((nx, ny))
                            stack.append((nx, ny))
                if best is None or len(cells) > len(best):
                    best = cells
    if best is None:
        return a
    keep = Image.new("L", a.size, 0)
    kp = keep.load()
    for cx, cy in best:
        kp[cx, cy] = 255
    # 只保留最大块附近，其余丢弃（用原 mask 做与）
    return ImageChops.multiply(a, keep)


def build(idx, im, box):
    cell = im.crop(box)
    a = alpha_of(cell)
    bb = a.getbbox()
    if bb is None:
        raise SystemExit("empty cell %d" % idx)
    a = a.crop(bb)
    a = a.filter(ImageFilter.GaussianBlur(0.6)).point(lambda v: 255 if v > 140 else (0 if v < 90 else int((v - 90) * 7.4)))
    g = cell.convert("L").crop(bb)

    # 稍微提一点纸面质感
    st = ImageStat.Stat(g)
    mean = st.mean[0]
    g = g.point(lambda v: max(0, min(255, int((v - mean) * 1.1 + mean + 4))))

    note = Image.merge("RGBA", (g, g, g, a))

    # 缩放放进统一画布
    lim_w = CW * FILL
    lim_h = CH * FILL
    s = min(lim_w / note.width, lim_h / note.height)
    note = note.resize((max(1, int(note.width * s)), max(1, int(note.height * s))), Image.LANCZOS)

    canvas = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    ox = (CW - note.width) // 2
    oy = int((CH - note.height) / 2 + 3)

    # 投影
    pad = 26
    sh = Image.new("L", (note.width + pad * 2, note.height + pad * 2), 0)
    sh.paste(note.split()[-1], (pad, pad))
    sh = sh.filter(ImageFilter.GaussianBlur(13)).point(lambda v: int(v * 0.34))
    shadow = Image.new("RGBA", sh.size, (28, 38, 30, 255))
    shadow.putalpha(sh)
    canvas.alpha_composite(shadow, (ox - pad, oy - pad + 11))
    canvas.alpha_composite(note, (ox, oy))
    return canvas


def main():
    im = Image.open(SRC).convert("RGB")
    W, H = im.size
    cw, chh = W // 2, H // 3
    for i, (col, row) in enumerate(CELLS, 1):
        box = (col * cw, row * chh, (col + 1) * cw, (row + 1) * chh)
        out = build(i, im, box)
        out.convert("LA").save(OUT + "note-%d.png" % i, optimize=True)
        print("note-%d.png" % i, out.size)

    # 目录有 8 格：7、8 号用镜像的纸，避免与前 6 张完全重复
    for src, dst in [(3, 7), (5, 8)]:
        n = Image.open(OUT + "note-%d.png" % src).transpose(Image.FLIP_LEFT_RIGHT)
        n.save(OUT + "note-%d.png" % dst, optimize=True)
        print("note-%d.png (mirror of %d)" % (dst, src))


if __name__ == "__main__":
    main()

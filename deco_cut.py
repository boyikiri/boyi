# -*- coding: utf-8 -*-
"""三张素材 -> 抠图 + 白色撕纸边（与既有 arch-*.png 底纹同一风格）
输出 deco-kant.png / deco-marx.png / deco-egret.png
"""
import os
import random
from collections import deque
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageStat

SRC = os.path.dirname(os.path.abspath(__file__))
DL = "C:/Users/Administrator/Downloads"
PAPER = (250, 247, 238)


# ---------------- 基础工具 ----------------
def flood_bg(im_rgb, seed_points, tol):
    """从若干种子点泛洪，返回背景蒙版 L (255=背景)"""
    w, h = im_rgb.size
    px = im_rgb.load()
    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    dq = deque()
    for sx, sy in seed_points:
        if 0 <= sx < w and 0 <= sy < h:
            dq.append((sx, sy))
    ref = px[seed_points[0][0], seed_points[0][1]]

    def close(c):
        return abs(c[0] - ref[0]) <= tol[0] and abs(c[1] - ref[1]) <= tol[1] and abs(c[2] - ref[2]) <= tol[2]

    while dq:
        x, y = dq.popleft()
        if mp[x, y]:
            continue
        if not close(px[x, y]):
            continue
        mp[x, y] = 255
        if x > 0: dq.append((x - 1, y))
        if x < w - 1: dq.append((x + 1, y))
        if y > 0: dq.append((x, y - 1))
        if y < h - 1: dq.append((x, y + 1))
    return mask


def flood_bg_local(im_rgb, tol=18):
    """从四边向内按"与相邻像素相似"生长，能吃掉渐变背景"""
    w, h = im_rgb.size
    px = im_rgb.load()
    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    dq = deque()
    for x in range(w):
        dq.append((x, 0)); dq.append((x, h - 1))
    for y in range(h):
        dq.append((0, y)); dq.append((w - 1, y))
    while dq:
        x, y = dq.popleft()
        if mp[x, y]:
            continue
        c = px[x, y]
        ok = False
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and mp[nx, ny]:
                n = px[nx, ny]
                if abs(c[0] - n[0]) <= tol and abs(c[1] - n[1]) <= tol and abs(c[2] - n[2]) <= tol:
                    ok = True
                    break
        if x in (0, w - 1) or y in (0, h - 1):
            ok = True     # 边界像素直接作为起点
        if not ok:
            continue
        mp[x, y] = 255
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not mp[nx, ny]:
                dq.append((nx, ny))
    return mask


def largest_component(mask):
    """保留最大连通域"""
    w, h = mask.size
    mp = mask.load()
    seen = Image.new("L", (w, h), 0)
    sp = seen.load()
    best, best_n = None, 0
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if mp[x, y] and not sp[x, y]:
                dq = deque([(x, y)])
                pts = []
                sp[x, y] = 255
                while dq:
                    cx, cy = dq.popleft()
                    pts.append((cx, cy))
                    for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                        if 0 <= nx < w and 0 <= ny < h and mp[nx, ny] and not sp[nx, ny]:
                            sp[nx, ny] = 255
                            dq.append((nx, ny))
                if len(pts) > best_n:
                    best_n, best = len(pts), pts
    out = Image.new("L", (w, h), 0)
    op = out.load()
    for x, y in best or []:
        op[x, y] = 255
    return out


def fill_holes(mask):
    """填洞：从外部泛洪背景，取反"""
    w, h = mask.size
    inv = Image.eval(mask, lambda v: 255 - v)
    bg = flood_bg(inv.convert("RGB"), [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)], (0, 0, 0))
    holes = ImageChops.subtract(inv, bg)
    return ImageChops.lighter(mask, holes)


def boundary_points(mask, step=2):
    """边缘像素：先补 2px 黑边再腐蚀相减，整块矩形的蒙版也能取到轮廓"""
    w, h = mask.size
    padded = Image.new("L", (w + 4, h + 4), 0)
    padded.paste(mask, (2, 2))
    edge = ImageChops.subtract(padded, padded.filter(ImageFilter.MinFilter(3)))
    edge = edge.crop((2, 2, w + 2, h + 2))
    mp = edge.load()
    return [(x, y) for y in range(0, h, step) for x in range(0, w, step) if mp[x, y]]


def tear_paper(mask, margin=20, fray=0.45, jitter=5, seed=7, step=2):
    """沿轮廓画随机半径圆 -> 手撕纸边蒙版"""
    w, h = mask.size
    pts = boundary_points(mask, step)
    paper = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(paper)
    rnd = random.Random(seed)
    for x, y in pts:
        r = margin * (1.0 - fray + 2 * fray * rnd.random())
        dx, dy = rnd.randint(-jitter, jitter), rnd.randint(-jitter, jitter)
        d.ellipse([x + dx - r, y + dy - r, x + dx + r, y + dy + r], fill=255)
    # 细碎纸屑，让边缘不那么规整
    for _ in range(max(40, len(pts) // 8)):
        x, y = pts[rnd.randrange(len(pts))]
        r = rnd.uniform(1.2, margin * 0.55)
        a = rnd.uniform(0, 6.28)
        cx, cy = x + (margin * 1.1) * random.Random(seed).uniform(-1, 1), y
        cx, cy = x + rnd.uniform(-margin, margin), y + rnd.uniform(-margin, margin)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    paper = ImageChops.lighter(paper, mask)
    paper = paper.filter(ImageFilter.MedianFilter(3))
    return paper.point(lambda v: 255 if v > 100 else 0)


def compose(im_rgb, subj_mask, out_path, margin=20, fray=0.45, seed=7):
    paper = tear_paper(subj_mask, margin=margin, fray=fray, seed=seed)
    canvas = Image.new("RGBA", im_rgb.size, PAPER + (0,))
    canvas.paste(Image.new("RGBA", im_rgb.size, PAPER + (255,)), (0, 0), paper)
    subj = im_rgb.convert("RGBA")
    subj.putalpha(subj_mask)
    canvas = Image.alpha_composite(canvas, subj)
    canvas.putalpha(paper)
    canvas.save(out_path, optimize=True)
    print("saved", out_path, canvas.size)


# ---------------- 三张图各自的处理 ----------------
def do_kant():
    """康德梗图：裁掉黑边，整张当作撕下来的印刷品"""
    p = os.path.join(DL, "Sorry,I Kant._1_Cinnamon Villain_来自小红书网页版.jpg")
    im = Image.open(p).convert("RGB")
    w, h = im.size
    px = im.load()
    # 找上下黑边：按行均值判断内容区
    def row_mean(y):
        return ImageStat.Stat(im.crop((0, y, w, y + 1)).convert("L")).mean[0]
    top, bot = 0, h - 1
    while top < h // 3 and row_mean(top) < 48:
        top += 1
    while bot > h // 2 and row_mean(bot) < 48:
        bot -= 1
    im = im.crop((0, top, w, bot + 1))
    # 左右也收一下
    w2, h2 = im.size
    def col_mean(x):
        return ImageStat.Stat(im.crop((x, 0, x + 1, h2)).convert("L")).mean[0]
    l, r = 0, w2 - 1
    while l < w2 // 8 and col_mean(l) < 48:
        l += 1
    while r > w2 * 7 // 8 and col_mean(r) < 48:
        r -= 1
    im = im.crop((l, 0, r + 1, h2))
    im.save(os.path.join(SRC, "_kant_crop.png"))
    mask = Image.new("L", im.size, 255)
    compose(im, mask, os.path.join(SRC, "deco-kant.png"), margin=22, fray=0.75, seed=3)


def do_marx():
    """马克思版画：白底上的墨迹 -> 阈值成块 -> 补洞 -> 取最大连通域"""
    p = os.path.join(DL, "u=2966815788,1859942311&fm=253&fmt=auto&app=138&f=JPEG.webp")
    im = Image.open(p).convert("RGB")
    # 放大一点，便于撕纸边有细节
    im = im.resize((im.size[0] * 3, im.size[1] * 3), Image.LANCZOS)
    g = im.convert("L")
    ink = g.point(lambda v: 255 if v < 205 else 0)          # 墨迹
    ink = ink.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))  # 闭运算连笔
    ink = ink.filter(ImageFilter.MaxFilter(7))               # 略作扩张，包住飞白
    ink = largest_component(ink)
    ink = fill_holes(ink)
    ink = ink.filter(ImageFilter.MinFilter(3))
    ink = ink.filter(ImageFilter.MaxFilter(3))
    compose(im, ink, os.path.join(SRC, "deco-marx.png"), margin=22, fray=0.55, seed=11)


def do_egret():
    """夜鹭：深绿背景泛洪去掉，保留鸟与落脚的一小截栏杆"""
    p = os.path.join(DL, "超级大美鹭！_1_Chienliii_来自小红书网页版.jpg")
    im = Image.open(p).convert("RGB")
    w, h = im.size
    im = im.crop((0, 0, w, int(h * 0.88)))                  # 裁掉大部分栏杆
    w, h = im.size
    r, g, b = im.split()
    greenness = ImageChops.subtract(g, ImageChops.blend(r, b, 0.5))   # 绿度：G - (R+B)/2
    bg = greenness.point(lambda v: 255 if v > 9 else 0)               # 绿色背景
    subj = Image.eval(bg, lambda v: 255 - v)
    subj = subj.filter(ImageFilter.MedianFilter(5))
    subj = largest_component(subj)
    subj = fill_holes(subj)
    subj = subj.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    compose(im, subj, os.path.join(SRC, "deco-egret.png"), margin=20, fray=0.55, seed=23)


if __name__ == "__main__":
    do_kant()
    do_marx()
    do_egret()

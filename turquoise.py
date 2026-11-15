"""把纸面底纹改成庞贝壁画本身的松石绿，并让壁画恢复原色、与纸面同调。
输出：bg-turquoise.jpg（整页底纹）、goddess_cover.jpg（封面壁画）"""
from PIL import Image, ImageChops

TILE_IN = "bg-green.jpg"
TILE_OUT = "bg-turquoise.jpg"
MURAL_IN = "goddess_mint.jpg"
MURAL_OUT = "goddess_cover.jpg"


def mean(img, box=None, step=12):
    if box:
        img = img.crop(box)
    im = img.resize((step, step), Image.LANCZOS)
    px = list(im.getdata())
    return tuple(sum(p[i] for p in px) // len(px) for i in range(3))


mural = Image.open(MURAL_IN).convert("RGB")
# 取一块干净的墙面作为松石绿基准
WALL = mean(mural, (0, 0, 300, 260))
print("fresco wall", WALL)

# 1) 底纹：保留明度颗粒，色相与饱和度统一到松石绿
tile = Image.open(TILE_IN).convert("RGB")
h, s, v = tile.convert("HSV").split()
hue_wall = Image.new("RGB", (1, 1), WALL).convert("HSV").getpixel((0, 0))[0]
sat_wall = Image.new("RGB", (1, 1), WALL).convert("HSV").getpixel((0, 0))[1]
print("target h/s", hue_wall, sat_wall)
h = h.point(lambda _: hue_wall)
s = s.point(lambda x: max(0, min(255, int(sat_wall * 0.92 + (x - 120) * 0.18))))
tile_tq = Image.merge("HSV", (h, s, v)).convert("RGB")

# 亮度归一，使底色均值与壁画墙面完全一致
cur = mean(tile_tq)
gains = [WALL[i] / max(1, cur[i]) for i in range(3)]
tile_tq = Image.merge("RGB", [
    ch.point(lambda x, g=g: max(0, min(255, int(x * g)))) for ch, g in zip(tile_tq.split(), gains)
])
tile_tq.save(TILE_OUT, quality=92, subsampling=1)
print(TILE_OUT, tile_tq.size, "avg", mean(tile_tq), "gains", [round(g, 3) for g in gains])

# 2) 壁画：叠同一张新纸纹，再把墙面拉到与底色一致
w, hh = mural.size
grain = Image.open(TILE_OUT).convert("L")
grain = grain.point(lambda x: max(1, min(255, int(x * 255 / WALL[1]))))
reps = Image.new("L", (w, hh))
tw, th = grain.size
for y in range(0, hh, th):
    for x in range(0, w, tw):
        reps.paste(grain, (x, y))
mult = ImageChops.multiply(mural, Image.merge("RGB", (reps, reps, reps)))
out = Image.blend(mural, mult, 0.5)

cur = mean(out, (0, 0, 300, 260))
gains = [WALL[i] / max(1, cur[i]) for i in range(3)]
out = Image.merge("RGB", [
    ch.point(lambda x, g=g: max(0, min(255, int(x * g)))) for ch, g in zip(out.split(), gains)
])
out.save(MURAL_OUT, quality=90, subsampling=1)
print(MURAL_OUT, out.size, "wall", mean(out, (0, 0, 300, 260)))

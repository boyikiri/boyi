from PIL import Image, ImageChops, ImageFilter, ImageStat

SRC = "C:/Users/Administrator/.workbuddy/clipboard-images/clipboard-2026-11-08T09-07-17-239Z-11c4da7d.jpg"
OUT = "C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/bg-green.jpg"

src = Image.open(SRC).convert("RGB")
W, H = src.size
side = min(W, H)
box = ((W - side) // 2, (H - side) // 2, (W + side) // 2, (H + side) // 2)
base = src.crop(box)

# 1) 抹平大范围明暗差：减去低频亮度再补回均值，保留细绒肌理
blur = base.filter(ImageFilter.GaussianBlur(150))
mean = [int(round(v)) for v in ImageStat.Stat(base).mean]
print("mean color", mean, "#%02x%02x%02x" % tuple(mean))

chans = []
for i in range(3):
    chans.append(ImageChops.subtract(base.split()[i], blur.split()[i], 1.0, mean[i]))
flat = Image.merge("RGB", chans)

# 2) 镜像拼贴 → 无缝平铺单元
w, h = flat.size
tile = Image.new("RGB", (w * 2, h * 2))
tile.paste(flat, (0, 0))
tile.paste(flat.transpose(Image.FLIP_LEFT_RIGHT), (w, 0))
tile.paste(flat.transpose(Image.FLIP_TOP_BOTTOM), (0, h))
tile.paste(flat.transpose(Image.ROTATE_180), (w, h))

tile = tile.resize((1024, 1024), Image.LANCZOS)
tile.save(OUT, quality=88, optimize=True, progressive=True)
print("saved", OUT, tile.size)

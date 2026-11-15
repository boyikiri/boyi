# -*- coding: utf-8 -*-
"""把撕纸素材叠成一张拼贴（纯透明底，只有层间投影，不加纸底）"""
from PIL import Image, ImageFilter

OUT = "C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/"
W, H = 1200, 1150


def load(name, width):
    im = Image.open(OUT + name).convert("RGBA")
    s = width / im.width
    return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)


def shadowed(im, blur=14, alpha=0.32, dy=8):
    pad = blur * 2
    canvas = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    sh = Image.new("RGBA", canvas.size, (26, 30, 20, 255))
    a = Image.new("L", canvas.size, 0)
    a.paste(im.split()[-1], (pad, pad))
    sh.putalpha(a.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * alpha)))
    canvas.alpha_composite(sh, (0, dy))
    canvas.alpha_composite(im, (pad, pad))
    return canvas


def place(base, im, cx, cy, angle, blur=14, alpha=0.32, dy=8):
    rot = im.rotate(angle, expand=True, resample=Image.BICUBIC)
    rot = shadowed(rot, blur=blur, alpha=alpha, dy=dy)
    base.alpha_composite(rot, (int(cx - rot.width / 2), int(cy - rot.height / 2)))


def main():
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    pin = load("scrap-pin.png", 424)
    cam = load("scrap-camera.png", 455)
    rose = load("scrap-rose.png", 300)

    place(base, rose, 705, 250, -5, blur=13, alpha=0.26)
    place(base, pin, 402, 806, -7, blur=18, alpha=0.3)
    place(base, cam, 430, 325, 6, blur=15, alpha=0.3)

    base.save(OUT + "cover-collage.png")
    print("cover-collage.png", base.size)


if __name__ == "__main__":
    main()

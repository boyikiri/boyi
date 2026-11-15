# -*- coding: utf-8 -*-
"""平遥双林寺彩塑：抠出主体 -> 黑白 -> 撕纸白边，用作“个人简介”背景素材。"""
from PIL import Image, ImageDraw, ImageFilter

from profile_art import gray, ragged_bottom, paper_effect

SRC = "C:/Users/Administrator/.workbuddy/clipboard-images/clipboard-2026-11-08T09-29-43-190Z-2e6f77a4.jpg"
OUT = "C:/Users/Administrator/WorkBuddy/2026-09-27-23-00-46/portfolio/"
BASE = (520, 937)

# 身体（含左侧垂下的手臂）
BODY = [
    (252, 96), (262, 84), (282, 84), (296, 96), (302, 122), (304, 150),
    (299, 178), (293, 202), (290, 222), (316, 230), (340, 240), (352, 262),
    (356, 292), (360, 324), (366, 354), (380, 378), (392, 400), (388, 430),
    (378, 460), (370, 488), (384, 514), (390, 550), (386, 588), (374, 624),
    (364, 662), (354, 698), (346, 728), (338, 766), (336, 800), (348, 818),
    (360, 846), (340, 866), (310, 858), (286, 842), (262, 838), (236, 852),
    (214, 858), (196, 866), (170, 880), (132, 870), (118, 842), (138, 808),
    (152, 772), (160, 734), (154, 702), (110, 690), (102, 660), (114, 624),
    (122, 588), (118, 552), (112, 516), (108, 486), (92, 478), (74, 470),
    (66, 450), (66, 424), (78, 404), (88, 382), (96, 356), (104, 330),
    (116, 306), (132, 284), (150, 262), (172, 244), (196, 232), (212, 222),
    (224, 208), (232, 190), (236, 162), (240, 132), (244, 108),
]

# 右上臂（肩到肘，处在暗部）
UPPER_ARM = [
    (350, 238), (378, 262), (408, 300), (434, 338), (426, 358),
    (398, 332), (368, 294), (344, 262),
]

# 右前臂（托举的护臂）
FOREARM = [
    (412, 356), (430, 332), (446, 300), (458, 270), (468, 240),
    (478, 214), (488, 194), (502, 184), (514, 196), (516, 218),
    (508, 244), (496, 272), (482, 302), (466, 332), (450, 358), (432, 372),
]

POLYS = (BODY, UPPER_ARM, FOREARM)


def build(out_w=430, name="arch-shuanglin.png"):
    im = Image.open(SRC).convert("RGB")
    h = int(round(out_w * im.height / im.width))
    im = im.resize((out_w, h), Image.LANCZOS)

    sx, sy = out_w / BASE[0], h / BASE[1]
    mask = Image.new("L", (out_w, h), 0)
    d = ImageDraw.Draw(mask)
    for poly in POLYS:
        d.polygon([(x * sx, y * sy) for x, y in poly], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.1))
    mask = ragged_bottom(mask, out_w, h, depth=int(h * 0.012), amp=9)

    g = gray(im)
    iso = Image.merge("RGB", (g, g, g.point(lambda v: max(0, v - 1))))
    subject = iso.convert("RGBA")
    subject.putalpha(mask)

    res = paper_effect(subject, pad_ratio=0.075)
    res.save(OUT + name)
    print("saved", name, res.size)
    return res


if __name__ == "__main__":
    build()

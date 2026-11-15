# -*- coding: utf-8 -*-
"""目录条目书法字 -> 透明墨色 WebP
源图是透明底黑字，alpha 通道即字形；裁到字缘并染成站点墨色 #25301c
"""
import os
from PIL import Image

SRC = os.path.dirname(os.path.abspath(__file__))
DL = "C:/Users/Administrator/Downloads"
INK = (37, 48, 28)   # 与站点 --ink 一致

MAP = [
    ("下载 (7).png",  "toc-title-1.webp", "教育背景"),
    ("下载 (8).png",  "toc-title-2.webp", "实习背景"),
    ("下载 (9).png",  "toc-title-3.webp", "在校经历"),
    ("下载 (10).png", "toc-title-4.webp", "绘画与设计"),
    ("下载 (11).png", "toc-title-5.webp", "视频剪辑"),
    ("下载 (12).png", "toc-title-6.webp", "文字创作"),
    ("下载 (13).png", "toc-title-7.webp", "账号运营"),
    ("下载 (14).png", "toc-title-8.webp", "AI技能"),
]


def process(src, dst):
    im = Image.open(os.path.join(DL, src)).convert("RGBA")
    alpha = im.split()[3]
    box = alpha.getbbox()
    if box:
        pad = 1
        box = (max(0, box[0] - pad), max(0, box[1] - pad),
               min(im.size[0], box[2] + pad), min(im.size[1], box[3] + pad))
        alpha = alpha.crop(box)
    out = Image.new("RGBA", alpha.size, INK + (0,))
    out.putalpha(alpha)
    out.save(os.path.join(SRC, dst), "WEBP", quality=92, method=6)
    print(dst, alpha.size, os.path.getsize(os.path.join(SRC, dst)))


for s, d, _ in MAP:
    process(s, d)

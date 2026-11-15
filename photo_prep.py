# -*- coding: utf-8 -*-
"""摄影作品入库：统一长边 1200、轻微锐化、导出 art/photoNN.jpg。
三格拼图按硬切位置拆成三张（竹编灯 / 屋脊兽 / 龙灯）。"""
import io, os
from PIL import Image, ImageFilter

BASE = os.path.dirname(os.path.abspath(__file__))
CLIP = r'C:\Users\Administrator\.workbuddy\clipboard-images'
DL = r'C:\Users\Administrator\Downloads'

JOBS = [
    ('photo01', os.path.join(DL, '微信图片_20261110181243_44_2.jpg'), None),
    ('photo02', os.path.join(DL, '微信图片_20261110180456_37_2.jpg'), None),
    ('photo03', os.path.join(DL, '微信图片_20261110180458_39_2.jpg'), None),
    ('photo04', os.path.join(CLIP, 'clipboard-2026-11-10T11-33-19-992Z-a23ea43c.jpg'), None),
    ('photo05', os.path.join(CLIP, 'clipboard-2026-11-10T11-33-19-999Z-b3fad1d9.jpg'), None),
    ('photo06', os.path.join(CLIP, 'clipboard-2026-11-10T11-33-20-010Z-1f37fac4.jpg'), None),
    ('photo07', os.path.join(CLIP, 'clipboard-2026-11-10T11-33-20-016Z-1cce5ed9.jpg'), None),
    ('photo08', os.path.join(CLIP, 'clipboard-2026-11-10T11-33-20-022Z-03d56533.jpg'), (0, 442)),
    ('photo09', os.path.join(CLIP, 'clipboard-2026-11-10T11-33-20-022Z-03d56533.jpg'), (443, 897)),
    ('photo10', os.path.join(CLIP, 'clipboard-2026-11-10T11-33-20-022Z-03d56533.jpg'), (898, 1920)),
    ('photo11', os.path.join(CLIP, 'clipboard-2026-11-10T11-33-20-029Z-8d3d329c.jpg'), None),
]

LONG = 1200

for name, path, box in JOBS:
    im = Image.open(path)
    if im.mode != 'RGB':
        im = im.convert('RGB')
    if box:
        im = im.crop((0, box[0], im.width, box[1]))
    w, h = im.size
    if max(w, h) > LONG:
        k = LONG / max(w, h)
        im = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.1, percent=58, threshold=3))
    out = os.path.join(BASE, 'art', name + '.jpg')
    im.save(out, 'JPEG', quality=86, optimize=True, progressive=True)
    print(name, im.size, round(im.width / im.height, 3), round(os.path.getsize(out) / 1024), 'KB')

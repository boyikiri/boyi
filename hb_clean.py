# -*- coding: utf-8 -*-
# Remove text from heibai campaign image via cv2.inpaint, then export brand-heibai.webp
from PIL import Image
import numpy as np
import cv2, os

SRC = r"C:\Users\Administrator\Pictures\Screenshots\屏幕截图 2026-11-15 083310.png"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "brand-heibai.webp")

pil = Image.open(SRC).convert("RGB")
rgb = np.asarray(pil)
bgr = rgb[:, :, ::-1].copy()
H, W = bgr.shape[:2]
print("size:", W, "x", H)

R = bgr[:, :, 2].astype(int)
G = bgr[:, :, 1].astype(int)
B = bgr[:, :, 0].astype(int)

# Orange text: R>205, G 105-190, B<115
orange = (R > 205) & (G > 105) & (G < 190) & (B < 115)
# Blue text: R<90, G 130-185, B>195
blue = (R < 90) & (G > 130) & (G < 185) & (B > 195)

mask = orange | blue
# Limit to upper-left text zone
limit = np.zeros((H, W), bool)
limit[:400, :1150] = True
mask &= limit

mask = mask.astype(np.uint8) * 255
mask = cv2.dilate(mask, np.ones((9, 9), np.uint8))
print("mask px:", int((mask > 0).sum()))

clean = cv2.inpaint(bgr, mask, 7, cv2.INPAINT_TELEA)

# Replace bottom-left logo group with a per-row sky fill sampled from just right of it,
# then feather the seam so no hard rectangle remains.
X0, X1 = 0, 430          # region to wipe
Y0 = 610                 # start wiping here
SAMP = (460, 505)        # clean sky columns used as row reference
filled = clean.copy()
for y in range(Y0, H):
    ref = clean[y, SAMP[0]:SAMP[1]].reshape(-1, 3).mean(axis=0)
    filled[y, X0:X1] = ref

# blend weight for the FILLED plate: 1 deep inside the wipe zone, 0 well outside,
# with a wide soft ramp so the seam is invisible.
w_r = np.clip((X1 + 50 - np.arange(W)) / 110.0, 0, 1)[None, :]
w_t = np.clip((np.arange(H) - (Y0 - 40)) / 90.0, 0, 1)[:, None]
w = cv2.GaussianBlur((w_r * w_t).astype(np.float32), (0, 0), 22)[:, :, None]

clean = (filled.astype(np.float32) * w + clean.astype(np.float32) * (1 - w)).astype(np.uint8)
# soften the whole plate area slightly so the sky reads as one continuous gradient
soft = cv2.GaussianBlur(clean, (0, 0), 2.5)
clean = (soft.astype(np.float32) * w * 0.9 + clean.astype(np.float32) * (1 - w * 0.9)).astype(np.uint8)

out = cv2.resize(clean, (1400, int(H * 1400 / W)), interpolation=cv2.INTER_AREA)
# 裁掉底部车头格栅（上面残留 "love" 白色车身字），只留下天空、人物与车顶弧线
out = out[: int(out.shape[0] * 0.63), :]
cv2.imwrite("_hb_check.png", out)  # ascii path check file
# save webp via PIL to keep quality control
Image.fromarray(out[:, :, ::-1]).save(OUT, "WEBP", quality=82)
print("saved:", OUT, os.path.getsize(OUT), "bytes")

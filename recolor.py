from PIL import Image, ImageEnhance

SRC = r"C:\Users\Administrator\WorkBuddy\2026-09-27-23-00-46\portfolio\goddess.jpg"
DST = r"C:\Users\Administrator\WorkBuddy\2026-09-27-23-00-46\portfolio\goddess_mint.jpg"

img = Image.open(SRC).convert("RGB")
hsv = img.convert("HSV")
H, S, V = hsv.split()
h_data = list(H.getdata())
s_data = list(S.getdata())
v_data = list(V.getdata())

# PIL HSV: H 0-255 maps to 0-360 deg, S/V 0-255
def feather(x, lo0, lo1, hi1, hi0):
    up = (x - lo0) / (lo1 - lo0)
    up = 0.0 if up < 0 else (1.0 if up > 1 else up)
    dn = (hi0 - x) / (hi0 - hi1)
    dn = 0.0 if dn < 0 else (1.0 if dn > 1 else dn)
    return up if up < dn else dn

out_h = [0] * len(h_data)
out_s = [0] * len(h_data)
out_v = [0] * len(h_data)

for i in range(len(h_data)):
    h, s, v = h_data[i], s_data[i], v_data[i]

    # weights (all 0-1)
    w_hue = feather(h, 55, 95, 175, 200)          # green / teal band
    w_sat = (s - 26) / 46.0                        # ignore near-neutral
    w_sat = 0.0 if w_sat < 0 else (1.0 if w_sat > 1 else w_sat)
    w_val = (v - 31) / 36.0                        # keep dark cracks
    w_val = 0.0 if w_val < 0 else (1.0 if w_val > 1 else w_val)
    w = w_hue * w_sat * w_val

    if w > 0.001:
        # hue: +26deg => +18.4 in 0-255 scale (toward blue)
        nh = int(h + 13 * w) % 256
        # value: lift toward light ceiling 237, keeping texture
        nv = v + (242 - v) * 0.62 * w
        nv = 255 if nv > 255 else int(nv)
        # saturation: soften to pastel
        ns = int(s * (1 - 0.52 * w))
        out_h[i], out_s[i], out_v[i] = nh, ns, nv
    else:
        out_h[i], out_s[i], out_v[i] = h, s, v

res = Image.merge("HSV", (
    Image.frombytes("L", H.size, bytes(out_h)),
    Image.frombytes("L", H.size, bytes(out_s)),
    Image.frombytes("L", H.size, bytes(out_v)),
)).convert("RGB")

res = ImageEnhance.Color(res).enhance(1.03)
res.save(DST, quality=94, subsampling=1)
print("saved", DST, res.size)

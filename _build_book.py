from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np, random, math

SRC = r'C:\Users\Administrator\.workbuddy\clipboard-images\clipboard-2026-11-11T11-05-23-090Z-686b5239.jpg'
im = Image.open(SRC).convert('RGB')

TL=(126.0,260.0); TR=(1056.9,215.7); BR=(1185.0,1542.0); BL=(204.0,1628.0)
cx=sum(p[0] for p in (TL,TR,BR,BL))/4; cy=sum(p[1] for p in (TL,TR,BR,BL))/4
k=0.020
TL,TR,BR,BL=[(p[0]+(cx-p[0])*k, p[1]+(cy-p[1])*k) for p in (TL,TR,BR,BL)]

OW,OH = 720,1056
flat = im.transform((OW,OH), Image.QUAD,
                    data=(TL[0],TL[1],BL[0],BL[1],BR[0],BR[1],TR[0],TR[1]),
                    resample=Image.BICUBIC)

a = np.asarray(flat).astype(np.float32)
g = (0.30*a[:,:,0] + 0.59*a[:,:,1] + 0.11*a[:,:,2])/255.0
lo, hi = np.percentile(g, 1.5), np.percentile(g, 99.0)
g = np.clip((g-lo)/max(1e-6,(hi-lo)), 0, 1)
g = np.clip((g-0.5)*1.14+0.605, 0, 1)**0.95
g = np.minimum(g, 0.945)
rng = np.random.default_rng(9)
g = np.clip(g + rng.normal(0, 0.012, g.shape), 0, 1)
W,H = OW,OH
gray = Image.fromarray((g*255).astype(np.uint8),'L').convert('RGBA')

def prof(n, amp, freq, seed, jitter=1.4, taper=True):
    r=random.Random(seed)
    ph=[r.uniform(0,6.28) for _ in range(6)]
    fs=[f*2*math.pi for f in (freq, freq*2.7, freq*5.9, freq*12.4, freq*26.0, freq*58.0)]
    ws=[0.40,0.26,0.15,0.10,0.06,0.03]
    out=np.empty(n, dtype=np.float32)
    t=np.linspace(0,1,n)
    for i in range(n):
        v=0.0
        for w_,f_,p_ in zip(ws,fs,ph):
            v+=w_*math.sin(t[i]*f_+p_)
        out[i]=v*amp+r.uniform(-jitter,jitter)
    if taper:
        m=max(1,int(n*0.05))
        e=np.clip(np.minimum(np.arange(n), np.arange(n)[::-1])/m, 0, 1)
        out*=e*0.76+0.24
    return out

AMP=20.0
top=prof(W,AMP,2.6,3); bot=prof(W,AMP*1.08,2.4,11)
lef=prof(H,AMP*0.95,1.9,19); rig=prof(H,AMP*1.05,2.1,27)

# 纤维宽度：2~9px，随机起伏
def fringe(n, seed):
    r=random.Random(seed); ph=[r.uniform(0,6.28) for _ in range(3)]
    t=np.linspace(0,1,n)
    v=0.5+0.34*math.sin(0)*0
    out=np.empty(n,dtype=np.float32)
    for i in range(n):
        s=0.55*math.sin(t[i]*2*math.pi*3.1+ph[0])+0.3*math.sin(t[i]*2*math.pi*8.7+ph[1])+0.15*math.sin(t[i]*2*math.pi*21.0+ph[2])
        out[i]=8.4+4.6*s+r.uniform(-1.0,1.0)
    return np.clip(out,3.0,14.0)
ftop=fringe(W,51); fbot=fringe(W,57); flef=fringe(H,63); frig=fringe(H,69)

Y=np.arange(H,dtype=np.float32)[:,None]; X=np.arange(W,dtype=np.float32)[None,:]
top2=np.broadcast_to(top,(W,1)).T if False else top[None,:]
bot2=bot[None,:]
lef2=lef[:,None]; rig2=rig[:,None]

def mask(extra=0.0, fr=None):
    if fr is None:
        et=eb=el=er=extra
    else:
        et,eb=fr[0][None,:], fr[1][None,:]
        el,er=fr[2][:,None], fr[3][:,None]
    m=(Y>=top2-et)&(Y<=H-1-(bot2-eb))&(X>=lef2-el)&(X<=W-1-(rig2-er))
    return Image.fromarray((m*255).astype(np.uint8),'L')

m_img = mask(0).filter(ImageFilter.GaussianBlur(0.6))
m_paper = mask(0,(ftop,fbot,flef,frig)).filter(ImageFilter.GaussianBlur(0.6))

import sys
BARE = '--bare' in sys.argv
PAD=44
CW,CH=W+PAD*2,H+PAD*2
def onc(m,dy=0):
    c=Image.new('L',(CW,CH),0); c.paste(m,(PAD,PAD+dy)); return c

out=Image.new('RGBA',(CW,CH),(0,0,0,0))
if BARE:
    lay=Image.new('RGBA',(CW,CH),(0,0,0,0)); lay.paste(gray,(PAD,PAD),m_img)
    out.alpha_composite(lay)
    full=onc(m_img)
    inner=ImageChops.subtract(full, full.filter(ImageFilter.MinFilter(9))).filter(ImageFilter.GaussianBlur(2.0))
    dark=Image.new('RGBA',(CW,CH),(24,32,27,0)); dark.putalpha(inner.point(lambda v:int(v*0.16)))
    out.alpha_composite(dark)
    out=out.crop(out.getbbox())
    out.save('book_questions.webp','WEBP',quality=90,method=6)
    print('bare size', out.size); raise SystemExit

sh=onc(m_paper,11).filter(ImageFilter.GaussianBlur(15))
shadow=Image.new('RGBA',(CW,CH),(22,30,25,0)); shadow.putalpha(sh.point(lambda v:int(v*0.26)))
out.alpha_composite(shadow)

pa=onc(m_paper)
pcol=Image.new('RGBA',(CW,CH),(252,248,238,255)); pcol.putalpha(pa)
out.alpha_composite(pcol)

lay=Image.new('RGBA',(CW,CH),(0,0,0,0)); lay.paste(gray,(PAD,PAD),m_img)
out.alpha_composite(lay)

# 纤维圈淡淡一层暖影，让纸边有厚度
ring=ImageChops.subtract(pa, onc(m_img)).filter(ImageFilter.GaussianBlur(1.8))
edge=Image.new('RGBA',(CW,CH),(158,134,92,0)); edge.putalpha(ring.point(lambda v:int(v*0.38)))
out.alpha_composite(edge)

# 撕口内侧暗边
full=onc(m_img)
inner=ImageChops.subtract(full, full.filter(ImageFilter.MinFilter(17))).filter(ImageFilter.GaussianBlur(3.4))
dark=Image.new('RGBA',(CW,CH),(24,32,27,0)); dark.putalpha(inner.point(lambda v:int(v*0.20)))
out.alpha_composite(dark)

out=out.crop(out.getbbox())
out.save('book_questions.png', optimize=True)
out.convert('RGB').save('_prev_book.jpg', quality=93)
print('size', out.size)

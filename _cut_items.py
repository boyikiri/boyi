from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from collections import deque

S1=r'C:/Users/Administrator/Downloads/复古旧物免扣拼贴素材_1_小鱼泡泡_来自小红书网页版.jpg'
S2=r'C:/Users/Administrator/Downloads/复古旧物免扣拼贴素材_2_小鱼泡泡_来自小红书网页版.jpg'

ITEMS = {
 'letter':   (S1,(108,84,560,576)),
 'sign':     (S1,(712,100,988,576)),
 'gramo':    (S1,(624,636,956,1120)),
 'poem':     (S1,(184,676,496,1084)),
 'dried':    (S1,(156,1160,532,1764)),
 'bouquet':  (S1,(636,1224,1044,1720)),
 'camera':   (S2,(72,52,560,416)),
 'rose':     (S2,(664,88,924,520)),
 'butterfly':(S2,(76,456,468,1156)),
 'cassette': (S2,(504,620,952,988)),
 'polaroid': (S2,(556,1100,1048,1588)),
 'vinyl':    (S2,(36,1264,548,1724)),
}

def cut(path, box, tol=26, pad=8, maxw=520):
    im = Image.open(path).convert('RGB')
    x0,y0,x1,y1 = box
    c = im.crop((max(0,x0-pad), max(0,y0-pad), min(im.width,x1+pad), min(im.height,y1+pad)))
    a = np.asarray(c).astype(np.int16)
    H,W,_ = a.shape
    # 背景色取四边中位数
    border = np.concatenate([a[0,:,:], a[-1,:,:], a[:,0,:], a[:,-1,:]])
    bg = np.median(border, axis=0)
    dist = np.abs(a - bg).sum(axis=2)
    near = dist < tol
    # 从边界泛洪
    bgmask = np.zeros((H,W), bool)
    dq = deque()
    for x in range(W):
        for y in (0, H-1):
            if near[y,x] and not bgmask[y,x]: bgmask[y,x]=True; dq.append((y,x))
    for y in range(H):
        for x in (0, W-1):
            if near[y,x] and not bgmask[y,x]: bgmask[y,x]=True; dq.append((y,x))
    while dq:
        y,x = dq.pop()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=y+dy,x+dx
            if 0<=ny<H and 0<=nx<W and near[ny,nx] and not bgmask[ny,nx]:
                bgmask[ny,nx]=True; dq.append((ny,nx))
    alpha = Image.fromarray(np.where(bgmask,0,255).astype(np.uint8), 'L')
    # 收一圈吃掉白边，再柔化
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    out = c.convert('RGBA'); out.putalpha(alpha)
    bb = out.getbbox()
    out = out.crop(bb)
    if out.width > maxw:
        out = out.resize((maxw, round(out.height*maxw/out.width)), Image.LANCZOS)
    return out

if __name__ == '__main__':
    tiles=[]
    for k,(p,b) in ITEMS.items():
        im = cut(p,b)
        im.save('_it_%s.png'%k)
        print(k, im.size)
        tiles.append((k,im))
    # 预览：薄荷底上排开
    S=6
    cw = 1200//3; ch=430
    sheet = Image.new('RGB',(1200, ch*((len(tiles)+2)//3)), (150,202,170))
    for i,(k,im) in enumerate(tiles):
        t = im.copy(); t.thumbnail((cw-20, ch-20), Image.LANCZOS)
        sheet.paste(t, ((i%3)*cw+10, (i//3)*ch+10), t)
    sheet.save('_preview_items.jpg', quality=92)

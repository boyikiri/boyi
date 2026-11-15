#!/bin/bash
# usage: ./_dvshot.sh outname [face] [act]
OUTN=${1:-_shot_dv}
FACE=${2:-1}
ACT=${3:-idle}
EVAL="(function(){var B=__wg.BIRDS.filter(function(x){return x.id==='dove'})[0];var b={spec:B,x:160,y:152,tx:160,ty:152,cx:0,cy:0,dir:1,face:$FACE,phase:'perch',t:0,stay:99999,act:'$ACT',actT:9,wx:160,step:0,dropped:false,peckT:0,peckTick:99};__wg.birds.length=0;__wg.birds.push(b);return 'ok';})()" OUT=$OUTN WAIT=2000 node _gshot.mjs >/dev/null 2>&1
python - "$OUTN" <<'PY'
import sys
from PIL import Image
n=sys.argv[1]
import glob
f=glob.glob('_shot_'+n+'.png') or glob.glob('_shot__shot_'+n+'.png')
im=Image.open(f[0])
S=954/320.0; OX,OY=23,67
cx,cy,w,h=160,152,60,52
x=int(OX+(cx-w/2)*S); y=int(OY+(cy-h)*S)
im.crop((x,y,x+int(w*S),y+int(h*S))).resize((int(w*S*6),int(h*S*6)),Image.NEAREST).save('_zoom_'+n+'.png')
print('ok',f[0])
PY

#!/usr/bin/env python3
"""Render fully composited cybersecurity motion graphics OVER the original human speech."""
import math,random,glob,subprocess,sys
from PIL import Image,ImageDraw,ImageFont
SOURCE=sys.argv[1]
OUT=sys.argv[2]
SIZE=(360,640)
W,H=SIZE
duration=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",SOURCE],text=True).strip())
fps=25
n=math.ceil(duration*fps)
fonts=glob.glob("/usr/share/fonts/**/*NotoSansArabic*Bold*.ttf",recursive=True)+glob.glob("/usr/share/fonts/**/*DejaVuSans-Bold*.ttf",recursive=True)
if not fonts: raise RuntimeError("Arabic font missing")
F=fonts[0]
def font(sz):
 return ImageFont.truetype(F,sz,layout_engine=ImageFont.Layout.RAQM)
f12,f14,f17,f23,f33=map(font,(12,14,17,23,33))
scenes=[
 (0,"دقيقة أمان","الأمن السيبراني بالعراق"),
 (5,"حكاية الأمن السيبراني","شلون نعتني بأمن معلوماتنا؟"),
 (14,"الوعي الرقمي","حماية البيانات تبدي من عدنا"),
 (24,"التهديدات الإلكترونية","التقنية تحتاج حماية مستمرة"),
 (35,"نظرة إلى المستقبل","وعي • حماية • تطوير"),
 (45,"احمِ معلوماتك","فكّر قبل ما تثق بأي رابط")
]
def drawing(t):
 im=Image.new("RGBA",SIZE,(0,0,0,0))
 d=ImageDraw.Draw(im,"RGBA")
 # animated upper and lower cinematic gradient masks
 for y in range(150):
  a=round(190*(1-y/150)**1.35)
  d.line([(0,y),(W,y)],fill=(1,13,25,a),width=1)
 for y in range(425,H):
  a=int(200*((y-425)/(H-425))**1.4)
  d.line([(0,y),(W,y)],fill=(1,13,25,a),width=1)
 # animated scanned circuit paths
 for j in range(10):
  xpos=((j*81+23)+t*({0:11,1:-8}.get(j%2,11)))%430-35
  a=45+int(30*(1+math.sin(t*1.1+j))*.5)
  d.line([(xpos,164),(xpos,300),(xpos+28,321)],fill=(30,222,210,a),width=1)
  d.ellipse((xpos+25,318,xpos+31,324),fill=(55,246,221,140))
 # scanning beam
 sy=int((t*73)%580)+28
 d.rectangle((0,sy,W,sy+1),fill=(54,245,232,80))
 # floating particles
 for j in range(31):
  x=int((j*79.1+20*math.sin(t*0.5+j))%W)
  y=int((j*131.7-t*(8+j%5))%H)
  r=1+j%2
  d.ellipse((x-r,y-r,x+r,y+r),fill=(70,245,224,70+j%4*22))
 # tech HUD borders
 d.line([(12,95),(12,65),(42,65)],fill=(55,242,223,165),width=2)
 d.line([(W-12,95),(W-12,65),(W-42,65)],fill=(55,242,223,165),width=2)
 d.line([(12,520),(12,552),(44,552)],fill=(55,242,223,130),width=2)
 d.line([(W-12,520),(W-12,552),(W-44,552)],fill=(55,242,223,130),width=2)
 # animated network node status
 cx=314;cy=230;rr=21+3*math.sin(t*2.3)
 d.ellipse((cx-rr,cy-rr,cx+rr,cy+rr),outline=(59,246,219,175),width=2)
 for j in range(6):
  ang=t*.65+j*math.pi/3
  x=cx+37*math.cos(ang);y=cy+37*math.sin(ang)
  d.ellipse((x-2,y-2,x+2,y+2),fill=(78,250,219,170))
  d.line((cx,cy,x,y),fill=(60,220,225,70),width=1)
 # branding HUD
 d.rounded_rectangle((20,24,146,49),radius=7,fill=(1,39,47,205),outline=(51,255,225,115),width=1)
 d.text((136,35),"دقيقة أمان",font=f14,anchor="rm",fill=(188,255,247,255),direction="rtl")
 d.text((W-20,32),"الحلقة ١  /  العراق",font=f12,anchor="ra",direction="rtl",fill=(139,231,232,210))
 # lower thirds animated cards, with gentle kinetic slide-in
 idx=0
 for j,s in enumerate(scenes):
  if t>=s[0]:idx=j
 title,subtitle=scenes[idx][1:]
 start=scenes[idx][0]
 eased=min(1,max(0,(t-start)/0.55))
 shift=int((1-eased)*W)
 d.rounded_rectangle((22+shift,424,W-22+shift,529),radius=13,fill=(2,32,43,223),outline=(58,249,225,110),width=2)
 d.rounded_rectangle((W-31+shift,438,W-27+shift,469),radius=2,fill=(55,254,212,240))
 d.text((W-43+shift,445),title,font=f23,direction="rtl",anchor="ra",fill=(242,255,255,255),stroke_width=0)
 d.text((W-43+shift,488),subtitle,font=f14,direction="rtl",anchor="ra",fill=(143,249,229,235))
 # animated progress and speaker credit
 d.rounded_rectangle((23,571,W-23,574),radius=1,fill=(42,97,102,170))
 d.rounded_rectangle((23,571,23+int((W-46)*min(1,t/duration)),574),radius=1,fill=(64,246,221,255))
 d.text((W-22,594),"شرح: محمد سلايس",font=f12,anchor="ra",direction="rtl",fill=(230,254,251,225))
 d.text((W-22,614),"إعداد ومونتاج: المبرمج المجهول",font=f12,anchor="ra",direction="rtl",fill=(160,223,225,215))
 # full cinematic intro - voice continues unmodified in the original video
 if t<3.4:
  a=min(240,int(240*min(t/.35,1)*(min((3.4-t)/.8,1))))
  d.rectangle((0,0,W,H),fill=(1,13,27,max(a,0)))
  d.rounded_rectangle((30,234,W-30,395),radius=16,fill=(4,35,48,max(0,int(a*.88))),outline=(57,255,221,max(0,int(a*.55))),width=2)
  d.text((W//2,272),"دقيقة أمان",font=f33,anchor="mm",direction="rtl",fill=(155,255,240,max(a,0)))
  d.text((W//2,347),"الأمن السيبراني بالعراق",font=f17,anchor="mm",direction="rtl",fill=(255,255,255,max(a,0)))
 # footer outro while speaker audio continues unchanged
 if t>duration-2.2:
  a=int(225*min(1,(t-duration+2.2)/.8))
  d.rounded_rectangle((22,233,W-22,388),radius=18,fill=(1,24,36,a),outline=(75,255,221,a),width=2)
  d.text((W//2,276),"خلي معلوماتك بأمان",font=f23,anchor="mm",direction="rtl",fill=(245,255,251,a))
  d.text((W//2,342),"دقيقة أمان  •  الحلقة الأولى",font=f14,anchor="mm",direction="rtl",fill=(118,242,222,a))
 return im
cmd=["ffmpeg","-hide_banner","-loglevel","error","-y","-i",SOURCE,"-f","rawvideo","-pixel_format","rgba","-video_size","360x640","-framerate",str(fps),"-i","pipe:0","-filter_complex","[0:v]fps=25,scale=720:1280:flags=lanczos,eq=contrast=1.05:saturation=1.1[base];[1:v]scale=720:1280:flags=bilinear[lay];[base][lay]overlay=shortest=1:format=auto,format=yuv420p[v]","-map","[v]","-map","0:a:0","-c:v","libx264","-preset","veryfast","-crf","20","-r",str(fps),"-c:a","copy","-movflags","+faststart","-shortest",OUT]
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
try:
 for i in range(n):
  if p.poll() is not None:raise RuntimeError("ffmpeg failed")
  p.stdin.write(drawing(i/fps).tobytes())
 p.stdin.close()
 rc=p.wait()
 if rc:raise RuntimeError("ffmpeg exit "+str(rc))
except BrokenPipeError:
 raise RuntimeError("Video encoder pipe closed unexpectedly")
print("OUTPUT",OUT)

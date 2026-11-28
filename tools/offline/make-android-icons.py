"""Generate placeholder launcher icons + splash for the NJH Android wrapper (teal Win98 look).
Run: python3 tools/offline/make-android-icons.py  (writes into njh-android/android/app/src/main/res)."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
RES = Path(__file__).resolve().parents[2] / 'njh-android/android/app/src/main/res'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
TEAL = (0, 128, 128, 255); NAVY = (0, 0, 128, 255); SILVER = (192, 192, 192, 255)
def tile(size, pad_frac=0.0, bg=True):
    im = Image.new('RGBA', (size, size), TEAL if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    p = int(size * pad_frac)
    box = (p + size * 0.12, p + size * 0.18, size - p - size * 0.12, size - p - size * 0.18)
    d.rectangle(box, fill=SILVER, outline=(255, 255, 255, 255), width=max(1, size // 48))
    bar = (box[0], box[1], box[2], box[1] + (box[3] - box[1]) * 0.24)
    d.rectangle(bar, fill=NAVY)
    f = ImageFont.truetype(FONT, int((box[2] - box[0]) * 0.34))
    t = 'NJH'; w = d.textlength(t, font=f)
    cy = bar[3] + (box[3] - bar[3]) / 2
    d.text(((size - w) / 2 + size * 0.012, cy - f.size * 0.58 + size * 0.012), t, font=f, fill=(0, 0, 0, 255))
    d.text(((size - w) / 2, cy - f.size * 0.58), t, font=f, fill=NAVY)
    return im
dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for k, m in dens.items():
    d = RES / f'mipmap-{k}'
    s = int(48 * m)
    tile(s).save(d / 'ic_launcher.png'); tile(s).save(d / 'ic_launcher_round.png')
    tile(int(108 * m), pad_frac=0.17, bg=False).save(d / 'ic_launcher_foreground.png')
(RES / 'values/ic_launcher_background.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#008080</color>\n</resources>\n')
def splash(w, h):
    im = Image.new('RGBA', (w, h), TEAL); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, max(12, int(min(w, h) * 0.11)))
    for i, t in enumerate(['NAMANYA', 'JUGA HIDUP']):
        tw = d.textlength(t, font=f); y = h / 2 - f.size * 1.1 + i * f.size * 1.15
        d.text(((w - tw) / 2 + 3, y + 3), t, font=f, fill=(9, 33, 55, 255)); d.text(((w - tw) / 2, y), t, font=f, fill=(255, 255, 255, 255))
    return im
for k, m in dens.items():
    for o in ('land', 'port'):
        w, h = (int(480 * m), int(320 * m)) if o == 'land' else (int(320 * m), int(480 * m))
        p = RES / f'drawable-{o}-{k}' / 'splash.png'
        if p.parent.exists(): splash(w, h).save(p)
splash(480, 320).save(RES / 'drawable/splash.png')
print('icons + splash written to', RES)

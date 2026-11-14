#!/usr/bin/env python3
"""Simple LFB Kost Cove facade (preview). sw/se/ne/nw.
Matches id200_bangunan_rumah_kos_dua_lantai footprint [5.5, 4.6] and
canvas/pivot so the lot, collision, and street use tile stay valid.
Based on the old procedural Cove facade (five numbered windows + glass door).
Palette from lfb-quality-guide; alpha 0/56/255; no AA; light from upper left.
"""
from __future__ import annotations
import json, sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, "/workspace/njh-interior-templates-r6")
from lfb_canvas import Canvas, hx, snap, shade

OUT = Path(__file__).resolve().parent / "njh_kost_cove"
FW, FD = 5.5, 4.6
CANVAS = {
    "sw": {"size": (338, 352), "pivot": (159, 272)},
    "se": {"size": (338, 350), "pivot": (160, 270)},
    "ne": {"size": (338, 352), "pivot": (159, 272)},
    "nw": {"size": (338, 350), "pivot": (160, 270)},
}

# Official Cove greys / glass — already in known-colors.json
WALL_LIT = hx("#E8EBEE")       # south/front in sun
WALL_MID = hx("#CDD3DA")
WALL_SHADE = hx("#BCC3CC")
WALL_BACK = hx("#A9B1BC")
ROOF = hx("#DDE1E6")
ROOF_EDGE = hx("#B2B9C3")
PARAPET = hx("#C3C9D1")
PLINTH = hx("#8D97A8")
FRAME = hx("#1C2330")
FRAME_MID = hx("#2A3242")
SILL = hx("#3A4458")
CANOPY = hx("#3A4458")
CANOPY_TOP = hx("#2A3242")
CANOPY_EDGE = hx("#1C2330")
GLASS_WARM = hx("#FFE7B0")
GLASS_WARM2 = hx("#FFF0C8")
GLASS_CURTAIN = hx("#FFD58A")
GLASS_DARK = hx("#4A5568")
GLASS_DARK2 = hx("#5E6A7E")
GLASS_DRAPE = hx("#E8ECF2")
HANDLE = hx("#8D97A8")
NUM = hx("#5A6577")
SIGN_BG = hx("#2A3242")
SIGN_FG = hx("#FFFFFF")
SIGN_EDGE = hx("#1C2330")
POT = hx("#3A4458")
LEAF_A = hx("#2A9A52")
LEAF_B = hx("#22894A")
MAT = hx("#5A6577")
LAMP = hx("#FFE08A")

# Two-storey heights in px (door ≈ 1.4 × 69 px avatar)
Z_PLINTH = 6
Z_DOOR = 100
Z_CANOPY0, Z_CANOPY1 = 108, 118
Z_L2 = 118
Z_WIN0, Z_WIN1 = 132, 188
Z_SIGN0, Z_SIGN1 = 194, 222
Z_PARAPET = 226
Z_ROOF = 232

# Street door at centre of the south facade (c=2.75) → use point x=-26.25
DOOR_C0, DOOR_C1 = 2.20, 3.30
WIN_W = 0.70
WIN_CS = (0.30, 1.35, 2.40, 3.45, 4.50)  # 1–5 left to right on +c (south face)

FONT3 = {
    "1": [".#.", "##.", ".#.", ".#.", "###"],
    "2": ["##.", "..#", ".#.", "#..", "###"],
    "3": ["###", "..#", ".##", "..#", "###"],
    "4": ["#.#", "#.#", "###", "..#", "..#"],
    "5": ["###", "#..", "###", "..#", "##."],
    "C": [".###.", "#...#", "#....", "#...#", ".###."],
    "O": [".###.", "#...#", "#...#", "#...#", ".###."],
    "V": ["#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "E": ["#####", "#....", "####.", "#....", "#####"],
    "K": ["#...#", "#..#.", "###..", "#..#.", "#...#"],
    "S": [".####", "#....", ".###.", "....#", "####."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#.."],
    " ": [".....", ".....", ".....", ".....", "....."],
}


def face_quad(cv, a, b, c, d, color, a255=255):
    cv.fill_poly([a, b, c, d], color, a255)


def face_s(cv, c0, c1, r, z0, z1, color, a=255):
    face_quad(cv, cv.xy(c0, r, z0), cv.xy(c1, r, z0), cv.xy(c1, r, z1), cv.xy(c0, r, z1), color, a)


def face_e(cv, c, r0, r1, z0, z1, color, a=255):
    face_quad(cv, cv.xy(c, r0, z0), cv.xy(c, r1, z0), cv.xy(c, r1, z1), cv.xy(c, r0, z1), color, a)


def face_n(cv, c0, c1, r, z0, z1, color, a=255):
    face_quad(cv, cv.xy(c0, r, z0), cv.xy(c1, r, z0), cv.xy(c1, r, z1), cv.xy(c0, r, z1), color, a)


def face_w(cv, c, r0, r1, z0, z1, color, a=255):
    face_quad(cv, cv.xy(c, r0, z0), cv.xy(c, r1, z0), cv.xy(c, r1, z1), cv.xy(c, r0, z1), color, a)


def slab(cv, c, r, w, d, z0, z1, top, side, edge=None):
    corners = [(c, r), (c + w, r), (c + w, r + d), (c, r + d)]
    bot = [cv.xy(*p, z0) for p in corners]
    toppts = [cv.xy(*p, z1) for p in corners]
    # painter: back faces first by average y
    faces = [
        ([toppts[0], toppts[1], bot[1], bot[0]], shade(side, 0.92)),  # north
        ([toppts[3], toppts[0], bot[0], bot[3]], shade(side, 0.80)),  # west
        ([toppts[1], toppts[2], bot[2], bot[1]], shade(side, 0.88)),  # east
        ([toppts[2], toppts[3], bot[3], bot[2]], shade(side, 1.00)),  # south
    ]
    faces.sort(key=lambda f: sum(p[1] for p in f[0]) / 4)
    for poly, col in faces:
        cv.fill_poly(poly, col)
    cv.fill_poly(toppts, top)
    if edge:
        for i in range(4):
            cv.line(*toppts[i], *toppts[(i + 1) % 4], edge)


def shadow(cv):
    # Ground diamond, slightly padded toward the south-east, alpha 56, black.
    pad_c, pad_r = 0.12, 0.18
    corners = [
        (-pad_c, -pad_c),
        (FW + pad_c, -pad_c),
        (FW + pad_c, FD + pad_r),
        (-pad_c, FD + pad_r),
    ]
    cv.fill_poly([cv.xy(c, r, 0) for c, r in corners], (0, 0, 0), 56)


def wall_colors(facing):
    """Screen-left face is lit (light from upper left). Door stays on world south."""
    # Returns colors for world faces: south, east, west, north, top
    lit, mid, sh, back = WALL_LIT, WALL_MID, WALL_SHADE, WALL_BACK
    if facing == "sw":
        return lit, sh, mid, back, ROOF
    if facing == "se":
        return sh, mid, lit, back, ROOF  # west is left/lit, south is right/shade
    if facing == "ne":
        return back, mid, sh, lit, ROOF
    if facing == "nw":
        return mid, lit, back, sh, ROOF
    return lit, sh, mid, back, ROOF


def face_step(cv, c, r, z, axis="c"):
    """Screen delta for +1 tile along a vertical wall."""
    x0, y0 = cv.xy(c, r, z)
    if axis == "c":
        x1, y1 = cv.xy(c + 1, r, z)
    else:
        x1, y1 = cv.xy(c, r + 1, z)
    return x0, y0, x1 - x0, y1 - y0


def blit_on_plane(cv, c, r, z_top, rows, color, axis="c", scale=1, u_sign=1):
    """Bitmap painted on a vertical wall plane (world u,z), not a flat screen block."""
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch != "#":
                continue
            for ky in range(scale):
                for kx in range(scale):
                    u = (i * scale + kx) * u_sign
                    v = j * scale + ky
                    if axis == "c":
                        x, y = cv.xy(c + u / 32.0, r, z_top - v)
                    else:
                        x, y = cv.xy(c, r + u / 32.0, z_top - v)
                    cv.put(x, y, color)


def glyph_w(ch):
    return len(FONT3.get(ch, FONT3[" "])[0])


def text_width(text, scale=1, tracking=1):
    if not text:
        return 0
    return (sum(glyph_w(ch) for ch in text) + tracking * (len(text) - 1)) * scale


def _along_screen_x(cv, c, r, z, axis, step):
    if axis == "c":
        x0, _ = cv.xy(c, r, z)
        x1, _ = cv.xy(c + step, r, z)
    else:
        x0, _ = cv.xy(c, r, z)
        x1, _ = cv.xy(c, r + step, z)
    return x1 - x0


def text_centered_on_face(cv, text, a0, a1, c, r, z0, z1, color, axis="c", scale=1, tracking=1):
    """Centre a phrase on a wall band. Glyphs sit on the iso plane, left→right on screen."""
    z_mid = (z0 + z1) / 2.0
    z_top = int(round(z_mid + (5 * scale - 1) / 2.0))
    bottom = z_top - (5 * scale - 1)
    if bottom < z0:
        z_top += z0 - bottom
    if z_top > z1:
        z_top = z1
    wpx = text_width(text, scale, tracking)
    span = abs(a1 - a0) * 32.0
    pad = max(0.0, (span - wpx) / 2.0) / 32.0
    # Walk toward increasing screen-x so the word is never mirrored.
    if _along_screen_x(cv, (a0 + a1) / 2.0 if axis == "c" else c,
                       r if axis == "c" else (a0 + a1) / 2.0,
                       z_mid, axis, 1) >= 0:
        start, u_sign = min(a0, a1) + pad, 1
    else:
        start, u_sign = max(a0, a1) - pad, -1
    cursor = 0
    for ch in text:
        glyph = FONT3.get(ch, FONT3[" "])
        if axis == "c":
            blit_on_plane(cv, start + u_sign * cursor / 32.0, r, z_top, glyph, color,
                          axis="c", scale=scale, u_sign=u_sign)
        else:
            blit_on_plane(cv, c, start + u_sign * cursor / 32.0, z_top, glyph, color,
                          axis="r", scale=scale, u_sign=u_sign)
        cursor += (glyph_w(ch) + tracking) * scale


def pots(cv, c, r):
    # Tiny pot + 3 leaf dots, sitting on the ground in front of the wall
    slab(cv, c - 0.14, r - 0.14, 0.28, 0.28, 0, 5, POT, POT)
    ax, ay = cv.xy(c, r, 5)
    for dx, dy, rad, col in (
        (0, -4, 3, LEAF_A), (-3, -2, 2, LEAF_B), (3, -2, 2, LEAF_A), (0, -7, 2, LEAF_B)
    ):
        # circles, integer, no AA
        cx, cy = ax + dx, ay + dy
        for yy in range(cy - rad, cy + rad + 1):
            for xx in range(cx - rad, cx + rad + 1):
                if (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= rad * rad:
                    cv.put(xx, yy, col)


def window(cv, c0, c1, r, z0, z1, occupied, number):
    # Dark frame, glass, sill. Thin features are lines so fill_poly cannot flood.
    face_s(cv, c0, c1, r, z0, z1, FRAME)
    if occupied:
        face_s(cv, c0 + 0.08, c1 - 0.08, r, z0 + 4, z1 - 4, GLASS_WARM)
        face_s(cv, c0 + 0.08, c1 - 0.08, r, z1 - 12, z1 - 4, GLASS_CURTAIN)
        # a couple of vertical fold lines, 1 px along the face
        for frac in (0.28, 0.50, 0.72):
            cc = c0 + (c1 - c0) * frac
            x0, y0 = cv.xy(cc, r, z0 + 4)
            x1, y1 = cv.xy(cc, r, z1 - 12)
            cv.line(x0, y0, x1, y1, shade(GLASS_CURTAIN, 0.88))
    else:
        face_s(cv, c0 + 0.08, c1 - 0.08, r, z0 + 4, z1 - 4, GLASS_DARK)
        # slim open-curtain edges via 1-px lines, plus a mullion
        for frac in (0.14, 0.86, 0.50):
            cc = c0 + (c1 - c0) * frac
            x0, y0 = cv.xy(cc, r, z0 + 4)
            x1, y1 = cv.xy(cc, r, z1 - 4)
            cv.line(x0, y0, x1, y1, GLASS_DRAPE if frac != 0.50 else GLASS_DARK2)
    face_s(cv, c0 - 0.04, c1 + 0.04, r, z0 - 4, z0, SILL)
    # number at the top of the pane, on the glass plane, inside the frame
    num_col = FRAME if occupied else hx("#E8ECF2")
    text_centered_on_face(cv, str(number), c0 + 0.12, c1 - 0.12, None, r, z1 - 16, z1 - 4,
                          num_col, axis="c", scale=1, tracking=1)


def side_window(cv, c, r0, r1, z0, z1, occupied=False):
    face_e(cv, c, r0, r1, z0, z1, FRAME)
    col = GLASS_WARM if occupied else GLASS_DARK
    face_e(cv, c, r0 + 0.08, r1 - 0.08, z0 + 4, z1 - 4, col)
    if not occupied:
        face_e(cv, c, r0 + 0.08, r0 + 0.18, z0 + 4, z1 - 4, GLASS_DRAPE)
        face_e(cv, c, r1 - 0.18, r1 - 0.08, z0 + 4, z1 - 4, GLASS_DRAPE)
    face_e(cv, c, r0 - 0.04, r1 + 0.04, z0 - 4, z0, SILL)


def side_window_w(cv, c, r0, r1, z0, z1, occupied=False):
    face_w(cv, c, r0, r1, z0, z1, FRAME)
    col = GLASS_WARM if occupied else GLASS_DARK
    face_w(cv, c, r0 + 0.08, r1 - 0.08, z0 + 4, z1 - 4, col)
    if not occupied:
        face_w(cv, c, r0 + 0.08, r0 + 0.18, z0 + 4, z1 - 4, GLASS_DRAPE)
        face_w(cv, c, r1 - 0.18, r1 - 0.08, z0 + 4, z1 - 4, GLASS_DRAPE)
    face_w(cv, c, r0 - 0.04, r1 + 0.04, z0 - 4, z0, SILL)


def door(cv):
    r = FD
    # frame
    face_s(cv, DOOR_C0 - 0.08, DOOR_C1 + 0.08, r, 0, Z_DOOR + 4, FRAME)
    # two lit glass leaves (lobby light)
    mid = (DOOR_C0 + DOOR_C1) / 2
    face_s(cv, DOOR_C0, mid - 0.03, r, 4, Z_DOOR, GLASS_WARM2)
    face_s(cv, mid + 0.03, DOOR_C1, r, 4, Z_DOOR, GLASS_WARM)
    face_s(cv, mid - 0.03, mid + 0.03, r, 4, Z_DOOR, FRAME)
    # handle on the right leaf
    face_s(cv, mid + 0.10, mid + 0.16, r, 42, 58, HANDLE)
    # transom
    face_s(cv, DOOR_C0, DOOR_C1, r, Z_DOOR - 10, Z_DOOR, shade(GLASS_WARM2, 0.95))
    # doormat just south of the threshold (visual only, on the use-tile side)
    slab(cv, DOOR_C0, FD - 0.02, DOOR_C1 - DOOR_C0, 0.32, 0, 2, MAT, shade(MAT, 0.85))
    # small canopy lamp
    x, y = cv.xy(mid, FD + 0.35, Z_CANOPY1)
    for yy in range(-2, 3):
        for xx in range(-2, 3):
            if xx * xx + yy * yy <= 4:
                cv.put(x + xx, y + yy, LAMP)


def dish(cv):
    # Small roof dish toward the back-east, simple
    c, r = 4.1, 1.2
    pole0, pole1 = Z_ROOF, Z_ROOF + 10
    x0, y0 = cv.xy(c, r, pole0)
    x1, y1 = cv.xy(c, r, pole1)
    cv.line(x0, y0, x1, y1, FRAME_MID)
    # ellipse dish
    cx, cy = cv.xy(c - 0.15, r, pole1 + 2)
    for yy in range(-5, 6):
        for xx in range(-8, 7):
            if (xx / 7.5) ** 2 + (yy / 4.0) ** 2 <= 1:
                cv.put(cx + xx, cy + yy, ROOF if abs((xx / 7.5) ** 2 + (yy / 4.0) ** 2) < 0.7 else ROOF_EDGE)


def north_window(cv, c0, c1, z0, z1, occupied=False):
    r = 0
    face_n(cv, c0, c1, r, z0, z1, FRAME)
    col = GLASS_WARM if occupied else GLASS_DARK
    face_n(cv, c0 + 0.08, c1 - 0.08, r, z0 + 4, z1 - 4, col)
    if not occupied:
        face_n(cv, c0 + 0.08, c0 + 0.16, r, z0 + 4, z1 - 4, GLASS_DRAPE)
        face_n(cv, c1 - 0.16, c1 - 0.08, r, z0 + 4, z1 - 4, GLASS_DRAPE)
    face_n(cv, c0 - 0.04, c1 + 0.04, r, z0 - 4, z0, SILL)


def back_door(cv):
    """Plain steel service door on the north wall, slightly off-centre."""
    r = 0
    c0, c1 = 2.05, 2.95
    face_n(cv, c0 - 0.08, c1 + 0.08, r, 0, 86, FRAME)
    face_n(cv, c0, c1, r, 2, 82, MAT)
    mid = (c0 + c1) / 2
    x0, y0 = cv.xy(mid, r, 10)
    x1, y1 = cv.xy(mid, r, 78)
    cv.line(x0, y0, x1, y1, FRAME_MID)
    face_n(cv, c1 - 0.18, c1 - 0.10, r, 40, 54, HANDLE)
    # tiny step at the threshold
    slab(cv, c0, -0.16, c1 - c0, 0.18, 0, 3, shade(PLINTH, 0.9), PLINTH)


def utility_box(cv):
    """Small meter box on the north wall, west of the service door."""
    r = 0
    face_n(cv, 0.45, 0.95, r, 36, 64, FRAME_MID)
    face_n(cv, 0.50, 0.90, r, 40, 60, SILL)
    x0, y0 = cv.xy(0.70, r, 44)
    x1, y1 = cv.xy(0.70, r, 56)
    cv.line(x0, y0, x1, y1, FRAME)


def drainpipe(cv, c, r, axis="e"):
    """1-px downpipe on a side wall, shoe kicking out at grade."""
    z0, z1 = 2, Z_PARAPET + 1
    x0, y0 = cv.xy(c, r, z1)
    x1, y1 = cv.xy(c, r, z0)
    cv.line(x0, y0, x1, y1, FRAME_MID)
    if axis == "e":
        x2, y2 = cv.xy(c, r + 0.22, 1)
    else:
        x2, y2 = cv.xy(c, r + 0.22, 1)
    cv.line(x1, y1, x2, y2, FRAME_MID)


def draw(facing):
    size, pivot = CANVAS[facing]["size"], CANVAS[facing]["pivot"]
    cv = Canvas(facing, size[0], size[1], FW, FD, pivot)
    south, east, west, north, top = wall_colors(facing)
    shadow(cv)

    # Near faces after rot(): view always shows the rotated south+east pair.
    # SW: south left + east right (street front + right side) — official id200 SW.
    # SE: west left + south right (left side + street front) — official id200 SE.
    # NE: north left + west right (back + left side).
    # NW: east left + north right (right side + back).
    # Do not draw far faces: they read as an inside-out open box.
    see_s = facing in ("sw", "se")
    see_e = facing in ("sw", "nw")
    see_w = facing in ("se", "ne")
    see_n = facing in ("ne", "nw")

    # Near wall whose screen-y is larger (closer) is painted second.
    near = []
    if see_n:
        near.append(("n", lambda: face_n(cv, 0, FW, 0, 0, Z_PARAPET, north)))
    if see_w:
        near.append(("w", lambda: face_w(cv, 0, 0, FD, 0, Z_PARAPET, west)))
    if see_e:
        near.append(("e", lambda: face_e(cv, FW, 0, FD, 0, Z_PARAPET, east)))
    if see_s:
        near.append(("s", lambda: face_s(cv, 0, FW, FD, 0, Z_PARAPET, south)))

    def _face_depth(name):
        if name == "s":
            pts = [cv.xy(0, FD, 0), cv.xy(FW, FD, 0), cv.xy(FW, FD, Z_PARAPET), cv.xy(0, FD, Z_PARAPET)]
        elif name == "n":
            pts = [cv.xy(0, 0, 0), cv.xy(FW, 0, 0), cv.xy(FW, 0, Z_PARAPET), cv.xy(0, 0, Z_PARAPET)]
        elif name == "e":
            pts = [cv.xy(FW, 0, 0), cv.xy(FW, FD, 0), cv.xy(FW, FD, Z_PARAPET), cv.xy(FW, 0, Z_PARAPET)]
        else:
            pts = [cv.xy(0, 0, 0), cv.xy(0, FD, 0), cv.xy(0, FD, Z_PARAPET), cv.xy(0, 0, Z_PARAPET)]
        return sum(p[1] for p in pts) / 4

    near.sort(key=lambda item: _face_depth(item[0]))
    for _, fn in near:
        fn()

    # Plinth on visible faces
    if see_s:
        face_s(cv, 0, FW, FD, 0, Z_PLINTH, PLINTH)
    if see_e:
        face_e(cv, FW, 0, FD, 0, Z_PLINTH, shade(PLINTH, 0.88))
    if see_w:
        face_w(cv, 0, 0, FD, 0, Z_PLINTH, shade(PLINTH, 0.92))
    if see_n:
        face_n(cv, 0, FW, 0, 0, Z_PLINTH, shade(PLINTH, 0.90))

    if see_s:
        face_s(cv, 0, FW, FD, Z_L2, Z_L2 + 3, shade(south, 0.92))
        for a, b in ((0.35, 1.95), (3.55, 5.15)):
            face_s(cv, a, b, FD, 8, Z_DOOR - 6, FRAME)
            face_s(cv, a + 0.08, b - 0.08, FD, 12, Z_DOOR - 10, GLASS_WARM)
            mid = (a + b) / 2
            x0, y0 = cv.xy(mid, FD, 12)
            x1, y1 = cv.xy(mid, FD, Z_DOOR - 10)
            cv.line(x0, y0, x1, y1, FRAME)
        door(cv)
        slab(cv, -0.05, FD - 0.05, FW + 0.10, 0.70, Z_CANOPY0, Z_CANOPY1, CANOPY_TOP, CANOPY, CANOPY_EDGE)
        for i, c0 in enumerate(WIN_CS, start=1):
            window(cv, c0, c0 + WIN_W, FD, Z_WIN0, Z_WIN1, occupied=(i >= 4), number=i)
        # Full-width sign band under the parapet; letters sit on the wall plane.
        face_s(cv, 0.15, FW - 0.15, FD, Z_SIGN0, Z_SIGN1, SIGN_EDGE)
        face_s(cv, 0.20, FW - 0.20, FD, Z_SIGN0 + 2, Z_SIGN1 - 2, SIGN_BG)
        text_centered_on_face(cv, "COVE", 0.20, FW - 0.20, None, FD,
                              Z_SIGN0 + 4, Z_SIGN1 - 4, SIGN_FG,
                              axis="c", scale=2, tracking=2)
        pots(cv, 1.55, FD + 0.18)
        pots(cv, 3.95, FD + 0.18)

    if see_e:
        side_window(cv, FW, 1.4, 2.2, Z_WIN0, Z_WIN1, occupied=False)
        side_window(cv, FW, 2.6, 3.4, 16, Z_DOOR - 8, occupied=False)
        drainpipe(cv, FW, 0.35, axis="e")
    if see_w:
        side_window_w(cv, 0, 1.4, 2.2, Z_WIN0, Z_WIN1, occupied=False)
        side_window_w(cv, 0, 2.6, 3.4, 16, Z_DOOR - 8, occupied=False)
        drainpipe(cv, 0, 0.35, axis="w")
    if see_n:
        face_n(cv, 0, FW, 0, Z_L2, Z_L2 + 3, shade(north, 0.92))
        north_window(cv, 0.55, 1.35, Z_WIN0, Z_WIN1, occupied=False)
        north_window(cv, 3.95, 4.75, Z_WIN0, Z_WIN1, occupied=False)
        north_window(cv, 3.95, 4.55, 20, 70, occupied=False)
        back_door(cv)
        utility_box(cv)

    # Parapet + flat roof + small dish (after walls so the shell is solid)
    slab(cv, 0.0, 0.0, FW, FD, Z_PARAPET, Z_ROOF, top, PARAPET, ROOF_EDGE)
    dish(cv)

    cv.pad_edges()
    return cv


def qa(im, label):
    from lfb_canvas import PALETTE, KNOWN
    px = im.load()
    w, h = im.size
    alphas = set()
    off = 0
    pal_off = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            alphas.add(a)
            if a not in (0, 56, 255):
                off += 1
            if a and ("%02X%02X%02X" % (r, g, b)) not in KNOWN:
                pal_off += 1
    print(f"QA {label}: size={im.size} alphas={sorted(alphas)} bad_alpha={off} off_palette={pal_off}")
    if off:
        raise SystemExit(f"non LFB alpha in {label}")
    if pal_off:
        raise SystemExit(f"off-palette pixels in {label}: {pal_off}")
    return True


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    variants = {}
    for facing in ("sw", "se", "ne", "nw"):
        cv = draw(facing)
        qa(cv.im, facing)
        path = OUT / f"njh_kost_cove_{facing}.png"
        cv.im.save(path)
        print("wrote", path)
        variants[facing] = {
            "file": f"njh_kost_cove_{facing}.png",
            "size": list(CANVAS[facing]["size"]),
            "pivot": list(CANVAS[facing]["pivot"]),
        }
    meta = {
        "format": "virtual-life-building-asset-v1",
        "id": "njh_kost_cove",
        "file": "object:njh_kost_cove",
        "label": "Kost Cove",
        "group": "kampung",
        "source": "njh-preview",
        "published": True,
        "note": (
            "Simple LFB two-storey Cove kost (preview). Based on the old procedural "
            "Cove facade (vo-mp/ind/p_cove.py, virtual-office/index.html): grey-white "
            "walls, five numbered windows, glass door, COVE KOST sign, thin canopy. "
            "Footprint and collision match pipeline:id200_bangunan_rumah_kos_dua_lantai "
            "so the lot and street use tile (-27, 71) stay valid. Glass door is centred "
            "on the south facade (c=2.75) at that use tile. Windows 4–5 glow for Ichsan "
            "and Noor; 1–3 stay dark/locked. sw/se/ne/nw. Preview only."
        ),
        "category": "bangunan",
        "assetKind": "rumah",
        "objectCategory": "building",
        "function": "kost",
        "sizeClass": "medium",
        "footprint": [FW, FD],
        "height": 8.981,
        "levelCount": 2,
        "placement": "ground",
        "collision": True,
        "rotation": 0,
        "rotation0": "sw",
        "variants": variants,
        "size": variants["sw"]["size"],
        "pivot": variants["sw"]["pivot"],
        "width": 7.469,
        "enterable": True,
        "interactions": ["enter"],
        "adaptedFrom": (
            "Cove exterior in virtual-office/index.html (~KOST 'Cove' block) and lobby "
            "door count in p_cove.py. Lot metrics from indonesia_200_catalog.json "
            "id200_bangunan_rumah_kos_dua_lantai (footprint [5.5, 4.6], sw 338×352 "
            "pivot [159, 272], se 338×350 pivot [160, 270])."
        ),
    }
    (OUT / "njh_kost_cove.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    print("wrote metadata")


if __name__ == "__main__":
    main()

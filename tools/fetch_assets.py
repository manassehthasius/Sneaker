"""Lädt die CC0-Material-Scans und Lichtumgebungen und bereitet sie für das Studio auf.

Quellen: Poly Haven (polyhaven.com) und ambientCG (ambientcg.com), beide CC0.
Aufruf:  python3 -I tools/fetch_assets.py

Die Farbtexturen werden in Graustufen umgewandelt und auf eine einheitliche
Helligkeit gebracht. So kann das Studio jedes Material in jeder Farbe einfärben,
ohne dass die Originalfarbe des Scans durchscheint.
"""

import io
import json
import math
import os
import random
import sys
import urllib.request
import zipfile

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "materials")
ENV_OUT = os.path.join(ROOT, "public", "env")
SIZE = 1024

# Material-ID im Studio -> Quelle
POLYHAVEN = {
    "leather": "leather_white",
    "suede": "scuba_suede",
}
AMBIENTCG = {
    "nubuck": "Leather029",
    "canvas": "Fabric061",
    "knit": "Fabric085",
    "cotton": "Fabric030",
    "rubber": "Rubber004",
}
HDRI = "studio_small_09"
# Mockup-Szenen: Dateiname -> Poly-Haven-Asset
SCENES = {"street": "birbeck_street_underpass", "parking": "abandoned_parking", "city": "canary_wharf"}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "sole-studio-asset-fetch"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def tintable(img: Image.Image, target: float = 0.80, contrast: float = 0.55) -> Image.Image:
    """Graustufen, Mittelwert auf `target`, Kontrast gedämpft."""
    g = ImageOps.grayscale(img).resize((SIZE, SIZE), Image.LANCZOS)
    mean = ImageStat.Stat(g).mean[0] / 255.0
    lut = []
    for v in range(256):
        x = v / 255.0
        y = target + (x - mean) * contrast
        lut.append(max(0, min(255, round(y * 255))))
    return g.point(lut)


def save(img: Image.Image, mat: str, kind: str, quality: int = 86) -> None:
    os.makedirs(os.path.join(OUT, mat), exist_ok=True)
    img.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS).save(
        os.path.join(OUT, mat, f"{kind}.jpg"), quality=quality, optimize=True
    )


def fetch_polyhaven(mat: str, asset: str) -> None:
    files = json.loads(get(f"https://api.polyhaven.com/files/{asset}"))
    maps = {"Diffuse": "albedo", "nor_gl": "normal", "Rough": "roughness"}
    for key, kind in maps.items():
        url = files[key]["1k"]["jpg"]["url"]
        img = Image.open(io.BytesIO(get(url)))
        save(tintable(img) if kind == "albedo" else img, mat, kind)
    print("polyhaven", mat, asset)


def fetch_ambientcg(mat: str, asset: str) -> None:
    data = get(f"https://ambientcg.com/get?file={asset}_1K-JPG.zip")
    z = zipfile.ZipFile(io.BytesIO(data))
    names = z.namelist()

    def pick(suffix: str):
        for n in names:
            if n.endswith(suffix):
                return Image.open(io.BytesIO(z.read(n)))
        return None

    col = pick("_Color.jpg")
    nor = pick("_NormalGL.jpg")
    rough = pick("_Roughness.jpg")
    if col is not None:
        save(tintable(col), mat, "albedo")
    if nor is not None:
        save(nor, mat, "normal")
    if rough is not None:
        save(rough, mat, "roughness")
    print("ambientcg", mat, asset, "maps:", [n.split("_")[-1] for n in names if n.endswith(".jpg")])


def height_to_normal(h: Image.Image, strength: float = 4.0) -> Image.Image:
    """Erzeugt eine OpenGL-Normal-Map aus einer Höhenkarte (0..255)."""
    w, hgt = h.size
    px = h.load()
    out = Image.new("RGB", (w, hgt))
    op = out.load()
    for y in range(hgt):
        for x in range(w):
            l = px[(x - 1) % w, y]
            r = px[(x + 1) % w, y]
            u = px[x, (y - 1) % hgt]
            d = px[x, (y + 1) % hgt]
            dx = (r - l) / 255.0 * strength
            dy = (d - u) / 255.0 * strength
            nx, ny, nz = -dx, dy, 1.0
            ln = math.sqrt(nx * nx + ny * ny + nz * nz)
            op[x, y] = (
                round((nx / ln * 0.5 + 0.5) * 255),
                round((ny / ln * 0.5 + 0.5) * 255),
                round((nz / ln * 0.5 + 0.5) * 255),
            )
    return out


def make_mesh() -> None:
    """Sportliches Mesh: Wabenlöcher, Albedo + Alpha + Normal."""
    n = 512
    cell = 32  # 16 Löcher pro Kachelbreite
    h = Image.new("L", (n, n), 200)
    a = Image.new("L", (n, n), 255)
    dh, da = ImageDraw.Draw(h), ImageDraw.Draw(a)
    rows = n // (cell * 0.866)
    for j in range(int(rows) + 2):
        y = j * cell * 0.866
        off = (cell / 2) if j % 2 else 0
        for i in range(-1, n // cell + 2):
            x = i * cell + off
            r = cell * 0.30
            box = [x - r, y - r, x + r, y + r]
            dh.ellipse([x - r - 4, y - r - 4, x + r + 4, y + r + 4], fill=150)
            dh.ellipse(box, fill=60)
            da.ellipse(box, fill=0)
    h = h.filter(ImageFilter.GaussianBlur(1.6))
    os.makedirs(os.path.join(OUT, "mesh"), exist_ok=True)
    tex = Image.merge("RGB", (h, h, h)).point(lambda v: 150 + v * 0.38)
    save(tex, "mesh", "albedo")
    save(a, "mesh", "alpha", quality=92)
    save(height_to_normal(h, 3.0), "mesh", "normal")
    print("procedural mesh")


def make_ripstop() -> None:
    """Ripstop: feines Gewebe mit verstärktem Karo-Raster."""
    n = 512
    random.seed(7)
    h = Image.new("L", (n, n), 128)
    d = ImageDraw.Draw(h)
    for i in range(0, n, 4):
        d.line([(i, 0), (i, n)], fill=140 + random.randint(-6, 6), width=1)
        d.line([(0, i), (n, i)], fill=118 + random.randint(-6, 6), width=1)
    for i in range(0, n, 32):
        d.line([(i, 0), (i, n)], fill=210, width=3)
        d.line([(0, i), (n, i)], fill=210, width=3)
    h = h.filter(ImageFilter.GaussianBlur(0.7))
    tex = h.point(lambda v: 185 + (v - 128) * 0.25)
    save(Image.merge("RGB", (tex, tex, tex)), "ripstop", "albedo")
    save(height_to_normal(h, 2.5), "ripstop", "normal")
    print("procedural ripstop")


def make_eva() -> None:
    """EVA-Schaum: sehr feine, gleichmässige Porenstruktur."""
    n = 512
    random.seed(3)
    noise = Image.effect_noise((n, n), 40).filter(ImageFilter.GaussianBlur(1.2))
    tex = noise.point(lambda v: 200 + (v - 128) * 0.08)
    save(Image.merge("RGB", (tex, tex, tex)), "eva", "albedo")
    save(height_to_normal(noise, 1.2), "eva", "normal")
    print("procedural eva")


def make_tread() -> None:
    """Fischgrat-Profil (Herringbone) für die Laufsohle, wie bei klassischen Court-Schuhen."""
    n = 512
    h = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(h)
    step = 16
    for row in range(0, n, 64):
        flip = (row // 64) % 2
        for x in range(-n, n * 2, step):
            if flip:
                d.line([(x, row), (x + 32, row + 64)], fill=255, width=7)
            else:
                d.line([(x + 32, row), (x, row + 64)], fill=255, width=7)
    h = h.filter(ImageFilter.GaussianBlur(1.4))
    save(height_to_normal(h, 5.0), "tread", "normal")
    print("procedural tread")


def fetch_hdri() -> None:
    os.makedirs(ENV_OUT, exist_ok=True)
    files = json.loads(get(f"https://api.polyhaven.com/files/{HDRI}"))
    url = files["hdri"]["1k"]["hdr"]["url"]
    with open(os.path.join(ENV_OUT, "studio.hdr"), "wb") as f:
        f.write(get(url))
    print("hdri", HDRI)
    for name, asset in SCENES.items():
        files = json.loads(get(f"https://api.polyhaven.com/files/{asset}"))
        with open(os.path.join(ENV_OUT, f"{name}.hdr"), "wb") as f:
            f.write(get(files["hdri"]["1k"]["hdr"]["url"]))
        print("scene", name, asset)


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "--procedural":
        make_mesh()
        make_ripstop()
        make_eva()
        make_tread()
        return
    for mat, asset in POLYHAVEN.items():
        fetch_polyhaven(mat, asset)
    for mat, asset in AMBIENTCG.items():
        fetch_ambientcg(mat, asset)
    make_mesh()
    make_ripstop()
    make_eva()
    make_tread()
    fetch_hdri()


if __name__ == "__main__":
    sys.exit(main())

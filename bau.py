"""Baut den Moodle-Vorlagensatz: Baukennung setzen, prüfen, ZIP schreiben, ablegen.

Aufruf:
    python bau.py             # Baukennung setzen, prüfen, ZIP im Projektordner
    python bau.py --ablegen   # zusätzlich ins Zielverzeichnis aus bau.json kopieren und prüfen
    python bau.py --pruefen   # nur prüfen, nichts ändern

Die Baukennung folgt der Regel aus D:/codebase/regeln/pwa.md: zwölf Ziffern
JJJJMMTTHHMM in UTC, bei jedem Bau neu, nie von Hand. Sie steht im Fußbanner
jeder Ansicht in <span class="bs_footer_build">Build …</span>. Fehlt die Marke,
bricht der Bau ab.

Nur Standardbibliothek, Python 3.10 oder neuer.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Moodle prüft beim Import jede dieser Dateien (mod_data manager::TEMPLATES_LIST).
PRESET_FILES = [
    "preset.xml",
    "addtemplate.html",
    "singletemplate.html",
    "listtemplateheader.html",
    "listtemplate.html",
    "listtemplatefooter.html",
    "asearchtemplate.html",
    "rsstemplate.html",
    "rsstitletemplate.html",
    "csstemplate.css",
    "jstemplate.js",
]
FOOTER_VIEWS = ["addtemplate.html", "singletemplate.html", "listtemplatefooter.html"]
BUILD_RE = re.compile(r'(<span class="bs_footer_build"[^>]*>Build )(\d{12})(</span>)')
SHORTCODE_RE = re.compile(r"\[\[([^\]#]+)(?:#[a-z]+)?\]\]")


class BauFehler(Exception):
    pass


def load_config() -> dict:
    cfg_path = ROOT / "bau.json"
    if not cfg_path.exists():
        raise BauFehler("bau.json fehlt im Projektordner.")
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    for key in ("titel", "zip", "lizenz"):
        if not cfg.get(key):
            raise BauFehler(f"bau.json: Schlüssel '{key}' fehlt.")
    cfg.setdefault("preset", "preset")
    return cfg


def build_id_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def field_names(preset_xml: Path) -> list[str]:
    try:
        tree = ET.parse(preset_xml)
    except ET.ParseError as err:
        raise BauFehler(f"preset.xml ist kein gültiges XML: {err}") from err
    root = tree.getroot()
    if root.tag != "preset":
        raise BauFehler("preset.xml: Wurzelelement muss <preset> sein.")
    settings = root.find("settings")
    if settings is None:
        raise BauFehler("preset.xml: <settings> fehlt.")
    for tag in ("defaultsort", "defaultsortdir"):
        if settings.find(tag) is None:
            raise BauFehler(f"preset.xml: <{tag}> fehlt in <settings>.")
    names = [f.findtext("name", "").strip() for f in root.findall("field")]
    if not names or "" in names:
        raise BauFehler("preset.xml: Feld ohne Namen oder gar keine Felder.")
    dupes = {n for n in names if names.count(n) > 1}
    if dupes:
        raise BauFehler(f"preset.xml: doppelte Feldnamen {sorted(dupes)}")
    return names


def check(cfg: dict, preset_dir: Path) -> list[str]:
    """Prüft den Vorlagensatz. Liefert Hinweise, wirft BauFehler bei Fehlern."""
    fehler: list[str] = []
    hinweise: list[str] = []

    missing = [f for f in PRESET_FILES if not (preset_dir / f).exists()]
    if missing:
        raise BauFehler(f"Pflichtdateien fehlen: {missing}")
    extra = sorted(p.name for p in preset_dir.iterdir() if p.name not in PRESET_FILES)
    if extra:
        fehler.append(f"Fremde Dateien im Vorlagenordner (kämen nicht ins ZIP): {extra}")

    names = field_names(preset_dir / "preset.xml")
    html = {f: read(preset_dir / f) for f in PRESET_FILES if f.endswith(".html")}

    used: dict[str, set[str]] = {}
    for fname, text in html.items():
        for code in SHORTCODE_RE.findall(text):
            used.setdefault(code, set()).add(fname)
    unknown = sorted(c for c in used if c not in names)
    if unknown:
        fehler.append(f"Kurzcodes ohne Feld in preset.xml: {unknown}")
    not_in_add = [n for n in names if "addtemplate.html" not in used.get(n, set())]
    if not_in_add:
        fehler.append(f"Felder fehlen in der Eingabeansicht: {not_in_add}")
    not_in_single = [n for n in names if "singletemplate.html" not in used.get(n, set())]
    if not_in_single:
        hinweise.append(f"Felder nicht in der Einzelansicht: {not_in_single}")

    lizenz = cfg["lizenz"]
    for view in FOOTER_VIEWS:
        text = html[view]
        if 'class="bs_footer_banner"' not in text:
            fehler.append(f"{view}: Fußbanner fehlt.")
        if not BUILD_RE.search(text):
            fehler.append(f'{view}: Marke <span class="bs_footer_build">Build 000000000000</span> fehlt.')
        if lizenz not in text:
            fehler.append(f"{view}: Lizenz '{lizenz}' fehlt im Fußbanner.")

    header = f"/* {lizenz} bildungssprit.de | Falk Szyba @medienrocker */"
    for fname in ("csstemplate.css", "jstemplate.js"):
        first = read(preset_dir / fname).lstrip("\ufeff").splitlines()[:1]
        if first != [header]:
            fehler.append(f"{fname}: erste Zeile muss '{header}' sein.")

    for fname in PRESET_FILES:
        text = read(preset_dir / fname)
        if "CC-BY-SA" in text and "CC-BY-SA" != lizenz:
            fehler.append(f"{fname}: alte Lizenzschreibweise 'CC-BY-SA'.")

    for fname, text in html.items():
        if "\u2014" in text or "\u2013" in text:
            fehler.append(f"{fname}: Gedankenstrich (Halbgeviert oder Geviert) im Text.")
        for tag in re.findall(r"<img\b[^>]*>", text):
            if " alt=" not in tag or " title=" not in tag:
                fehler.append(f"{fname}: Bild ohne alt oder title: {tag[:80]}")
        for tag in re.findall(r"<a\b[^>]*>", text):
            if " title=" not in tag:
                fehler.append(f"{fname}: Link ohne title: {tag[:80]}")
        if re.search(r"<(html|head|body|link)\b", text, re.I):
            fehler.append(f"{fname}: enthält HTML-Hülle (html, head, body oder link).")

    if fehler:
        raise BauFehler("Prüfung fehlgeschlagen:\n  - " + "\n  - ".join(fehler))
    return hinweise


def stamp(preset_dir: Path, build_id: str) -> None:
    for view in FOOTER_VIEWS:
        path = preset_dir / view
        text = read(path)
        new, count = BUILD_RE.subn(lambda m: m.group(1) + build_id + m.group(3), text)
        if count == 0:
            raise BauFehler(f"{view}: keine Baukennungs-Marke gefunden.")
        path.write_text(new, encoding="utf-8", newline="")


def current_build(preset_dir: Path) -> str:
    match = BUILD_RE.search(read(preset_dir / FOOTER_VIEWS[0]))
    return match.group(2) if match else ""


def write_zip(preset_dir: Path, zip_path: Path) -> None:
    tmp = zip_path.with_suffix(".zip.tmp")
    with zipfile.ZipFile(tmp, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name in PRESET_FILES:
            info = zipfile.ZipInfo(name, date_time=datetime.now().timetuple()[:6])
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, (preset_dir / name).read_bytes())
    with zipfile.ZipFile(tmp) as zf:
        if zf.testzip() is not None or sorted(zf.namelist()) != sorted(PRESET_FILES):
            raise BauFehler("ZIP-Prüfung fehlgeschlagen.")
    tmp.replace(zip_path)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ablegen(src: Path, ziel_dir: Path) -> Path:
    if not ziel_dir.is_dir():
        raise BauFehler(f"Zielverzeichnis fehlt: {ziel_dir}")
    dst = ziel_dir / src.name
    shutil.copyfile(src, dst)
    if sha256(src) != sha256(dst):
        raise BauFehler(f"Kopie nach {dst} weicht vom Original ab.")
    return dst


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--ablegen", action="store_true", help="ZIP ins Zielverzeichnis kopieren")
    parser.add_argument("--pruefen", action="store_true", help="nur prüfen, nichts ändern")
    args = parser.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

    try:
        cfg = load_config()
        preset_dir = ROOT / cfg["preset"]
        hinweise = check(cfg, preset_dir)
        if args.pruefen:
            print(f"Prüfung bestanden, Baukennung im Bestand: {current_build(preset_dir)}")
        else:
            build_id = build_id_now()
            stamp(preset_dir, build_id)
            check(cfg, preset_dir)
            zip_path = ROOT / cfg["zip"]
            write_zip(preset_dir, zip_path)
            print(f"{cfg['titel']}: Build {build_id} -> {zip_path.name}")
            if args.ablegen:
                if not cfg.get("ziel"):
                    raise BauFehler("bau.json: 'ziel' fehlt für --ablegen.")
                dst = ablegen(zip_path, Path(cfg["ziel"]))
                print(f"Abgelegt und geprüft: {dst}")
        for h in hinweise:
            print(f"Hinweis: {h}")
    except BauFehler as err:
        print(f"FEHLER: {err}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

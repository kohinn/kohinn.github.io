#!/usr/bin/env python3
"""
作品画像の「軽い版」を作り、works.json / works_en.json に書き込む道具です。

なぜ必要か
  元画像は 2894x4093px などの大きさです。一覧に出す画像は幅360px前後なので、
  そのまま読み込むと、通信量が増え、ブラウザの縮小処理でスクロールがカクつきます。
  そこで、用途ごとの大きさの画像を thumbs/ に作ります。

作るもの（縦長の絵 / 横長の絵）
  thumb  : 一覧・ホームのサムネイル用 (幅720 / 1280)
  medium : ホームの大きな絵・Aboutの絵用 (幅1100 / 1600)
  large  : 作品詳細ページ用 (幅1600 / 2000)
  元画像は変更しません（詳細ページの「原寸で見る」から開けます）。

使い方
  python3 tools/make_thumbs.py <元画像のフォルダ>            # まだ無いものだけ作る
  python3 tools/make_thumbs.py <元画像のフォルダ> --force    # すべて作り直す

  <元画像のフォルダ> は、kohinn-images リポジトリをダウンロード(clone)したフォルダです。
  新しい作品を works.json に足したあとに実行してください。
  works.json の image に書いたファイル名から、元画像を探します。

必要なもの: Python 3 と Pillow (pip install pillow)
"""
import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
THUMBS = ROOT / "thumbs"

# (縦長の絵の幅, 横長の絵の幅)
SIZES = {"thumb": (720, 1280), "medium": (1100, 1600), "large": (1600, 2000)}
QUALITY = {"thumb": 80, "medium": 80, "large": 82}


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "work"


def original_name(url: str) -> str:
    return unquote(url.split("kohinn-images/")[-1])


def to_date(release: str) -> str:
    """「2026年11月」を「2026-11」にする（並べ替え用）。"""
    m = re.search(r"(\d{4})年\s*(\d{1,2})月", release or "")
    return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}" if m else ""


def make_variants(src: Path, base: str, force: bool):
    im = Image.open(src)
    im.load()
    landscape = im.width > im.height
    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    im = im.convert("RGBA" if has_alpha else "RGB")

    out = {}
    for key, (w_portrait, w_landscape) in SIZES.items():
        target_w = min(w_landscape if landscape else w_portrait, im.width)
        target_h = round(im.height * target_w / im.width)
        path = THUMBS / f"{base}-{key[0]}.webp"
        if force or not path.exists():
            im.resize((target_w, target_h), Image.LANCZOS).save(
                path, "WEBP", quality=QUALITY[key], method=6
            )
        out[key] = f"thumbs/{path.name}"
        if key == "large":
            out["w"], out["h"] = target_w, target_h
    return out


def with_fields(work: dict, fields: dict) -> dict:
    """image の直後に、新しい項目を入れる（見やすい順番にそろえる）。"""
    new = {}
    for k, v in work.items():
        if k in fields:
            continue
        new[k] = v
        if k == "image":
            new.update(fields)
    if "image" not in work:
        new.update(fields)
    return new


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("originals", help="元画像のフォルダ（kohinn-images）")
    ap.add_argument("--force", action="store_true", help="作成済みの画像も作り直す")
    args = ap.parse_args()

    src_dir = Path(args.originals)
    if not src_dir.is_dir():
        sys.exit(f"フォルダが見つかりません: {src_dir}")
    THUMBS.mkdir(exist_ok=True)

    files = {"ja": ROOT / "works.json", "en": ROOT / "works_en.json"}
    data = {k: json.loads(p.read_text(encoding="utf-8")) for k, p in files.items()}
    en_by_id = {w["id"]: i for i, w in enumerate(data["en"])}

    total = 0
    for i, work in enumerate(data["ja"]):
        date = to_date(work.get("release", ""))
        fields = {}
        if work.get("image"):
            name = original_name(work["image"])
            src = src_dir / name
            if not src.exists():
                print(f"  ! 元画像が見つかりません: {name}（{work['id']}）")
            else:
                fields = make_variants(src, slug(work["id"]), args.force)
                total += 1
        if date:
            fields["date"] = date

        data["ja"][i] = with_fields(work, fields)
        j = en_by_id.get(work["id"])
        if j is not None:
            data["en"][j] = with_fields(data["en"][j], fields)
        print(f"  ok {work['id']}")

    for k, p in files.items():
        p.write_text(json.dumps(data[k], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"完了: {total} 点の画像を処理しました（thumbs/ と works*.json を更新）")


if __name__ == "__main__":
    main()

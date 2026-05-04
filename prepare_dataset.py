"""prepare_dataset.py — Baixa imagens de vaca do COCO 2017 e prepara para YOLO.

Etapas:
  1. Baixa annotations_trainval2017.zip do COCO (~241 MB)
  2. Extrai instances_val2017.json
  3. Filtra apenas imagens com a classe "cow" (category_id=21)
  4. Baixa somente essas imagens individualmente (~200 imgs, ~50 MB)
  5. Converte anotações para formato YOLO (x_center y_center w h, normalizado)
  6. Divide 80% train / 20% val
  7. Atualiza data.yaml
"""

import json
import random
import zipfile
from collections import defaultdict
from pathlib import Path

import requests

ANNOTATIONS_URL = "http://images.cocodataset.org/annotations/annotations_trainval2017.zip"
COCO_IMG_BASE = "http://images.cocodataset.org/val2017"
COW_CATEGORY_ID = 21  # ID da classe "cow" no COCO
VAL_SPLIT = 0.2
DATASET_DIR = Path("dataset")
ANNOTATIONS_ZIP = Path("annotations_coco.zip")
ANNOTATIONS_JSON = Path("annotations") / "instances_val2017.json"


def download_with_progress(url: str, dest: Path) -> None:
    print(f"Baixando {url} ...")
    resp = requests.get(url, stream=True, timeout=60)
    resp.raise_for_status()
    total = int(resp.headers.get("content-length", 0))
    downloaded = 0
    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1024 * 256):
            f.write(chunk)
            downloaded += len(chunk)
            if total:
                pct = downloaded * 100 / total
                bar = "#" * int(pct / 2)
                print(f"\r  [{bar:<50}] {pct:5.1f}%", end="", flush=True)
    print()


def main() -> None:
    # 1. Baixar annotations zip (apenas se não existir)
    if not ANNOTATIONS_ZIP.exists():
        download_with_progress(ANNOTATIONS_URL, ANNOTATIONS_ZIP)
    else:
        print(f"Arquivo {ANNOTATIONS_ZIP} já existe, pulando download.")

    # 2. Extrair JSON de instâncias de validação
    if not ANNOTATIONS_JSON.exists():
        print("Extraindo annotations/instances_val2017.json ...")
        with zipfile.ZipFile(ANNOTATIONS_ZIP) as z:
            z.extract("annotations/instances_val2017.json", ".")
    else:
        print(f"{ANNOTATIONS_JSON} já existe, pulando extração.")

    # 3. Carregar e filtrar anotações de vaca
    print("Carregando anotações ...")
    with open(ANNOTATIONS_JSON, encoding="utf-8") as f:
        coco = json.load(f)

    cow_anns = [a for a in coco["annotations"] if a["category_id"] == COW_CATEGORY_ID]
    cow_image_ids = {a["image_id"] for a in cow_anns}
    id_to_img = {img["id"]: img for img in coco["images"] if img["id"] in cow_image_ids}

    print(f"Encontradas {len(cow_image_ids)} imagens com vacas no COCO val2017.")

    anns_by_image: dict[int, list] = defaultdict(list)
    for ann in cow_anns:
        anns_by_image[ann["image_id"]].append(ann)

    # 4. Criar estrutura de pastas
    for split in ("train", "val"):
        (DATASET_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (DATASET_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)

    # 5. Dividir train/val
    image_ids = list(cow_image_ids)
    random.seed(42)
    random.shuffle(image_ids)
    val_size = max(1, int(len(image_ids) * VAL_SPLIT))
    val_ids = set(image_ids[:val_size])
    train_ids = set(image_ids[val_size:])

    # 6. Baixar imagens e gerar labels YOLO
    total = len(image_ids)
    skipped = 0
    for i, img_id in enumerate(image_ids, 1):
        info = id_to_img[img_id]
        filename = info["file_name"]
        w, h = info["width"], info["height"]
        split = "val" if img_id in val_ids else "train"

        img_dest = DATASET_DIR / "images" / split / filename
        if not img_dest.exists():
            try:
                r = requests.get(f"{COCO_IMG_BASE}/{filename}", timeout=30)
                r.raise_for_status()
                img_dest.write_bytes(r.content)
            except Exception as exc:
                print(f"\n  AVISO: não foi possível baixar {filename}: {exc}")
                skipped += 1
                continue

        # Label YOLO — classe 0 (única classe: cow)
        label_dest = DATASET_DIR / "labels" / split / (Path(filename).stem + ".txt")
        with open(label_dest, "w") as lf:
            for ann in anns_by_image[img_id]:
                x, y, bw, bh = ann["bbox"]   # COCO: x_min, y_min, largura, altura
                xc = (x + bw / 2) / w
                yc = (y + bh / 2) / h
                lf.write(f"0 {xc:.6f} {yc:.6f} {bw/w:.6f} {bh/h:.6f}\n")

        print(f"\r  Processando imagem {i}/{total} ...", end="", flush=True)

    print(f"\n\nDataset pronto!")
    print(f"  Train : {len(train_ids) - skipped} imagens")
    print(f"  Val   : {len(val_ids)} imagens")
    if skipped:
        print(f"  AVISO : {skipped} imagens não puderam ser baixadas (serão ignoradas).")

    # 7. Garantir que data.yaml está correto
    data_yaml = "path: dataset\n\ntrain: images/train\nval: images/val\n\nnc: 1\nnames: ['cow']\n"
    Path("data.yaml").write_text(data_yaml, encoding="utf-8")
    print("data.yaml atualizado.")


if __name__ == "__main__":
    main()

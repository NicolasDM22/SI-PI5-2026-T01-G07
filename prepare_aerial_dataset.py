"""
Converte o dataset aerial-cows (COCO JSON) para formato YOLOv8.

Uso:
    python prepare_aerial_dataset.py --tar "C:/Users/Bhort/Downloads/dataset.tar.gz"

Resultado:
    dataset_aerial/
      images/train/  images/val/
      labels/train/  labels/val/
    data_aerial.yaml
"""

import argparse
import json
import shutil
import tarfile
from pathlib import Path

TAR_PREFIX = "home/zuppif/Documents/Work/RoboFlow/ODinW-RF100-challenge/rf100/aerial-cows"
SPLITS = {"train": "train", "val": "valid"}
COW_CATEGORY_ID = 1  # categoria "cow" no JSON COCO deste dataset


def coco_to_yolo(bbox, img_w, img_h):
    x, y, w, h = bbox
    cx = (x + w / 2) / img_w
    cy = (y + h / 2) / img_h
    nw = w / img_w
    nh = h / img_h
    return f"0 {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}"


def convert(tar_path: str):
    tar_path = Path(tar_path)
    assert tar_path.exists(), f"Arquivo não encontrado: {tar_path}"

    out_root = Path("dataset_aerial")

    with tarfile.open(tar_path, "r:gz") as tar:
        members_by_name = {m.name: m for m in tar.getmembers()}

        for split_name, split_dir in SPLITS.items():
            img_out = out_root / "images" / split_name
            lbl_out = out_root / "labels" / split_name
            img_out.mkdir(parents=True, exist_ok=True)
            lbl_out.mkdir(parents=True, exist_ok=True)

            ann_key = f"{TAR_PREFIX}/{split_dir}/_annotations.coco.json"
            ann_file = tar.extractfile(members_by_name[ann_key])
            coco = json.load(ann_file)

            # mapa image_id → info
            images = {img["id"]: img for img in coco["images"]}

            # mapa image_id → lista de anotações
            annotations = {}
            for ann in coco["annotations"]:
                if ann["category_id"] != COW_CATEGORY_ID:
                    continue
                annotations.setdefault(ann["image_id"], []).append(ann)

            ok = 0
            for img_id, img_info in images.items():
                fname = img_info["file_name"]
                img_key = f"{TAR_PREFIX}/{split_dir}/{fname}"

                if img_key not in members_by_name:
                    continue

                # copia imagem
                src = tar.extractfile(members_by_name[img_key])
                with open(img_out / fname, "wb") as dst:
                    shutil.copyfileobj(src, dst)

                # escreve labels
                lines = []
                for ann in annotations.get(img_id, []):
                    lines.append(coco_to_yolo(ann["bbox"], img_info["width"], img_info["height"]))

                lbl_file = lbl_out / (Path(fname).stem + ".txt")
                lbl_file.write_text("\n".join(lines))
                ok += 1

            print(f"[{split_name}] {ok} imagens convertidas")

    data_yaml = Path("data_aerial.yaml")
    data_yaml.write_text(
        f"path: {out_root.resolve().as_posix()}\n"
        f"train: images/train\n"
        f"val:   images/val\n"
        f"\n"
        f"nc: 1\n"
        f"names: ['cow']\n"
    )
    print(f"\ndata_aerial.yaml criado.")
    print("Agora rode: python train_aerial.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tar", required=True)
    args = parser.parse_args()
    convert(args.tar)

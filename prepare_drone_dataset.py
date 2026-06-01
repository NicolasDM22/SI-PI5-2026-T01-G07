"""
Prepara o dataset Cattle_drone_images_042024 para YOLOv8.
Anotações já estão em YOLO format (classe 0 = cow).

Uso:
    python prepare_drone_dataset.py --zip "C:/Users/Bhort/Downloads/Cattle_drone_images_042024.zip"

Resultado:
    dataset_drone/
      images/train/  images/val/
      labels/train/  labels/val/
    data_drone.yaml
"""

import argparse
import random
import shutil
import zipfile
from pathlib import Path

FARMS = ["Derval", "Jalogny", "Mauron", "Other_farms"]
RANDOM_SEED = 42
VAL_RATIO = 0.2


def find_yolo_folder(zip_file, farm):
    for name in zip_file.namelist():
        if f"{farm}/" in name and "YOLO" in name and name.endswith(".txt"):
            parts = name.split("/")
            yolo_idx = next(i for i, p in enumerate(parts) if "YOLO" in p)
            return "/".join(parts[:yolo_idx + 1])
    return None


def find_label_path(nameset, yolo_base, session, stem):
    # estrutura com obj_train_data (Derval, Mauron)
    candidate = f"{yolo_base}/{session}/obj_train_data/{stem}.txt"
    if candidate in nameset:
        return candidate
    # estrutura sem obj_train_data (Other_farms, Jalogny)
    candidate = f"{yolo_base}/{session}/{stem}.txt"
    if candidate in nameset:
        return candidate
    return None


def convert(zip_path: str):
    zip_path = Path(zip_path)
    assert zip_path.exists(), f"Arquivo não encontrado: {zip_path}"

    out_root = Path("dataset_drone")
    for split in ["train", "val"]:
        (out_root / "images" / split).mkdir(parents=True, exist_ok=True)
        (out_root / "labels" / split).mkdir(parents=True, exist_ok=True)

    all_pairs = []

    with zipfile.ZipFile(zip_path) as zf:
        nameset = set(zf.namelist())

        for farm in FARMS:
            yolo_base = find_yolo_folder(zf, farm)
            if not yolo_base:
                print(f"[{farm}] pasta YOLO não encontrada, pulando")
                continue

            img_entries = [n for n in nameset if f"{farm}/JPGImages/" in n and n.upper().endswith(".JPG")]
            farm_ok = 0

            for img_path in img_entries:
                stem = Path(img_path).stem
                session = img_path.split("/")[-2]
                label_path = find_label_path(nameset, yolo_base, session, stem)

                if not label_path:
                    continue

                with zf.open(label_path) as lf:
                    label_content = lf.read().decode("utf-8").strip()

                all_pairs.append((img_path, label_content, zf.open(img_path).read()))
                farm_ok += 1

            print(f"[{farm}] {farm_ok} imagens")

        print(f"Total de imagens com anotações: {len(all_pairs)}")

        random.seed(RANDOM_SEED)
        random.shuffle(all_pairs)
        split_idx = int(len(all_pairs) * (1 - VAL_RATIO))

        for i, (img_path, label_content, img_bytes) in enumerate(all_pairs):
            split = "train" if i < split_idx else "val"
            fname = Path(img_path).name

            with open(out_root / "images" / split / fname, "wb") as f:
                f.write(img_bytes)

            lbl_file = out_root / "labels" / split / (Path(fname).stem + ".txt")
            lbl_file.write_text(label_content)

        train_count = split_idx
        val_count = len(all_pairs) - split_idx
        print(f"Train: {train_count} | Val: {val_count}")

    data_yaml = Path("data_drone.yaml")
    data_yaml.write_text(
        f"path: {out_root.resolve().as_posix()}\n"
        f"train: images/train\n"
        f"val:   images/val\n"
        f"\n"
        f"nc: 1\n"
        f"names: ['cow']\n"
    )
    print(f"\ndata_drone.yaml criado.")
    print("Quando o treino atual terminar, rode: python train_drone.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", required=True)
    args = parser.parse_args()
    convert(args.zip)

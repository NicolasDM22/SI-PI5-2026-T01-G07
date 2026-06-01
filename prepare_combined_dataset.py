"""
Combina dataset_aerial + dataset_drone em dataset_combined.
Rode após ter executado prepare_aerial_dataset.py e prepare_drone_dataset.py.

Uso:
    python prepare_combined_dataset.py
"""

import shutil
from pathlib import Path

SOURCES = ["dataset_aerial", "dataset_drone"]
OUT = Path("dataset_combined")


def combine():
    for split in ["train", "val"]:
        (OUT / "images" / split).mkdir(parents=True, exist_ok=True)
        (OUT / "labels" / split).mkdir(parents=True, exist_ok=True)

    for src_name in SOURCES:
        src = Path(src_name)
        if not src.exists():
            print(f"[AVISO] {src_name} não encontrado, pulando")
            continue

        for split in ["train", "val"]:
            imgs = list((src / "images" / split).glob("*"))
            lbls = list((src / "labels" / split).glob("*"))

            for f in imgs:
                dest = OUT / "images" / split / f"{src_name}_{f.name}"
                shutil.copy2(f, dest)

            for f in lbls:
                dest = OUT / "labels" / split / f"{src_name}_{f.name}"
                shutil.copy2(f, dest)

            print(f"[{src_name}/{split}] {len(imgs)} imagens copiadas")

    data_yaml = Path("data_combined.yaml")
    data_yaml.write_text(
        f"path: {OUT.resolve().as_posix()}\n"
        f"train: images/train\n"
        f"val:   images/val\n"
        f"\n"
        f"nc: 1\n"
        f"names: ['cow']\n"
    )

    total_train = len(list((OUT / "images" / "train").glob("*")))
    total_val = len(list((OUT / "images" / "val").glob("*")))
    print(f"\nTotal — Train: {total_train} | Val: {total_val}")
    print("data_combined.yaml criado.")
    print("Rode: python train_combined.py")


if __name__ == "__main__":
    combine()

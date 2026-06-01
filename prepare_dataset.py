"""
Converte o dataset Cows2021 (DatasetNinja/Supervisely) para o formato YOLOv8.

Uso:
    python prepare_dataset.py --tar "C:/Users/Bhort/Downloads/cows2021-DatasetNinja.tar"

Resultado:
    dataset/
      images/train/  images/val/
      labels/train/  labels/val/
    data.yaml  (atualizado)
"""

import argparse
import json
import shutil
import tarfile
from pathlib import Path

SPLITS = {
    "train": "detection_and_localisation-train",
    "val":   "detection_and_localisation-val",
}

CLASS_NAME = "cattle torso"


def supervisely_to_yolo(points: list, img_w: int, img_h: int) -> str:
    (x1, y1), (x2, y2) = points[0], points[1]
    cx = ((x1 + x2) / 2) / img_w
    cy = ((y1 + y2) / 2) / img_h
    w  = abs(x2 - x1) / img_w
    h  = abs(y2 - y1) / img_h
    return f"0 {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}"


def convert(tar_path: str):
    tar_path = Path(tar_path)
    assert tar_path.exists(), f"Arquivo não encontrado: {tar_path}"

    out_root = Path("dataset")
    print(f"Extraindo para pasta temporária...")

    with tarfile.open(tar_path) as tar:
        members = tar.getmembers()

        for split_name, prefix in SPLITS.items():
            img_out = out_root / "images" / split_name
            lbl_out = out_root / "labels" / split_name
            img_out.mkdir(parents=True, exist_ok=True)
            lbl_out.mkdir(parents=True, exist_ok=True)

            ann_members = [m for m in members if m.name.startswith(f"{prefix}/ann/") and m.name.endswith(".json")]
            img_members = {m.name: m for m in members if m.name.startswith(f"{prefix}/img/")}

            print(f"\n[{split_name}] {len(ann_members)} anotações encontradas")
            ok = 0
            skipped = 0

            for ann_m in ann_members:
                stem = Path(ann_m.name).stem  # ex: "07117.jpg"
                img_key = f"{prefix}/img/{stem}"

                if img_key not in img_members:
                    skipped += 1
                    continue

                # lê JSON da anotação
                f = tar.extractfile(ann_m)
                ann = json.load(f)
                img_w = ann["size"]["width"]
                img_h = ann["size"]["height"]

                lines = []
                for obj in ann.get("objects", []):
                    if obj.get("classTitle") == CLASS_NAME and obj.get("geometryType") == "rectangle":
                        pts = obj["points"]["exterior"]
                        if len(pts) >= 2:
                            lines.append(supervisely_to_yolo(pts, img_w, img_h))

                # copia imagem
                img_m = img_members[img_key]
                img_src = tar.extractfile(img_m)
                img_dest = img_out / stem
                with open(img_dest, "wb") as dst:
                    shutil.copyfileobj(img_src, dst)

                # escreve label (pode ser vazio se não houver anotações)
                lbl_file = lbl_out / (Path(stem).stem + ".txt")
                lbl_file.write_text("\n".join(lines))

                ok += 1

            print(f"[{split_name}] {ok} imagens convertidas, {skipped} ignoradas")

    # atualiza data.yaml
    data_yaml = Path("data.yaml")
    data_yaml.write_text(
        f"path: {out_root.resolve().as_posix()}\n"
        f"train: images/train\n"
        f"val:   images/val\n"
        f"\n"
        f"nc: 1\n"
        f"names: ['cow']\n"
    )
    print(f"\ndata.yaml atualizado: {data_yaml.resolve()}")
    print("\nPronto! Agora rode o treino:")
    print("  python train.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tar", required=True, help="Caminho do arquivo .tar do dataset")
    args = parser.parse_args()
    convert(args.tar)

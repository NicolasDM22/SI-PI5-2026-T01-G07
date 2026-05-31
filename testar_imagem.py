"""
Testa uma imagem manualmente com o modelo YOLO treinado para vacas/gado.

Uso:
    python3 testar_imagem.py caminho/da/imagem.jpg
"""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import torch
from ultralytics import YOLO

_original_torch_load = torch.load


def _patched_torch_load(*args, **kwargs):
    kwargs["weights_only"] = False
    return _original_torch_load(*args, **kwargs)


torch.load = _patched_torch_load


def main() -> None:
    parser = argparse.ArgumentParser(description="Testa uma imagem com o detector de vacas.")
    parser.add_argument("imagem", help="Caminho da imagem para testar.")
    parser.add_argument("--conf", type=float, default=0.25, help="Confianca minima. Padrao: 0.25")
    parser.add_argument("--iou", type=float, default=0.30, help="IOU do NMS. Padrao: 0.30")
    parser.add_argument(
        "--mostrar-labels",
        action="store_true",
        help="Mostra nome e confianca nas caixas da imagem salva.",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=960,
        help="Tamanho de inferencia. Use 960 ou 1280 para imagens aereas. Padrao: 960",
    )
    args = parser.parse_args()

    image_path = Path(args.imagem)
    if not image_path.exists():
        raise SystemExit(f"Imagem nao encontrada: {image_path}")

    model_path = Path(__file__).resolve().parent / "best.pt"
    if not model_path.exists():
        raise SystemExit(f"Modelo nao encontrado: {model_path}")

    model = YOLO(model_path)
    results = model.predict(
        source=str(image_path),
        conf=args.conf,
        iou=args.iou,
        imgsz=args.imgsz,
        save=True,
        project="runs/detect",
        name="teste_manual",
        exist_ok=True,
        show_labels=args.mostrar_labels,
        show_conf=args.mostrar_labels,
        line_width=2,
        verbose=False,
    )

    result = results[0]
    cow_count = len(result.boxes)
    output_path = Path("runs/detect/teste_manual") / image_path.name
    annotated_image = result.plot(line_width=2)

    label = f"Vacas detectadas: {cow_count}"
    cv2.rectangle(annotated_image, (10, 10), (320, 60), (0, 0, 0), -1)
    cv2.putText(
        annotated_image,
        label,
        (20, 45),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 0),
        2,
        cv2.LINE_AA,
    )
    cv2.imwrite(str(output_path), annotated_image)

    print(f"Modelo usado: {model_path}")
    print(f"Confianca minima: {args.conf}")
    print(f"IOU NMS: {args.iou}")
    print(f"Imagem de inferencia: {args.imgsz}")
    print(f"Imagem testada: {image_path}")
    print(f"Output anotado: {output_path}")
    print(f"Classes do modelo: {model.names}")
    print(f"Quantidade de vacas na imagem: {cow_count}")
    print(f"Deteccoes: {cow_count}")

    for index, box in enumerate(result.boxes, 1):
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        bbox = [round(float(value), 1) for value in box.xyxy[0].tolist()]
        print(
            f"{index}. classe={class_id} nome={model.names[class_id]} "
            f"confianca={confidence:.3f} bbox={bbox}"
        )


if __name__ == "__main__":
    main()

"""Fine-tuning do modelo YOLOv8 para detecção de gado.

Uso:
    python fine_tune.py                          # usa padrões abaixo
    python fine_tune.py --epochs 50 --model yolov8s.pt
    python fine_tune.py --resume runs/detect/train5/weights/last.pt

Variáveis de ambiente opcionais:
    YOLO_DEVICE   - 'cpu', '0' (GPU 0), 'mps' (Apple Silicon)  [padrão: auto]
    YOLO_DATA     - caminho para data.yaml                       [padrão: data.yaml]
"""

import argparse
import os
from pathlib import Path

from ultralytics import YOLO


PREV_BEST = "runs/detect/train4/weights/best.pt"
DATA_YAML = os.getenv("YOLO_DATA", "data.yaml")
DEVICE = os.getenv("YOLO_DEVICE", "")          # "" = ultralytics escolhe automaticamente


def parse_args():
    p = argparse.ArgumentParser(description="Fine-tuning YOLOv8 — detecção de gado")
    p.add_argument("--model", default=PREV_BEST,
                   help="Modelo base (.pt). Padrão: best.pt do train4")
    p.add_argument("--data", default=DATA_YAML,
                   help="Caminho para data.yaml do dataset")
    p.add_argument("--epochs", type=int, default=50,
                   help="Número de épocas [padrão: 50]")
    p.add_argument("--imgsz", type=int, default=640,
                   help="Tamanho de imagem de entrada [padrão: 640]")
    p.add_argument("--batch", type=int, default=16,
                   help="Batch size [padrão: 16]")
    p.add_argument("--resume", default=None,
                   help="Continuar de um checkpoint last.pt")
    p.add_argument("--name", default=None,
                   help="Nome do experimento (subdir em runs/detect/)")
    p.add_argument("--larger-model", action="store_true",
                   help="Usar yolov8s.pt como base (ignora --model)")
    return p.parse_args()


def main():
    args = parse_args()

    if args.resume:
        model = YOLO(args.resume)
        print(f"Retomando treino a partir de: {args.resume}")
    elif args.larger_model:
        model = YOLO("yolov8s.pt")
        print("Usando yolov8s (small) como base")
    else:
        if not Path(args.model).exists():
            raise FileNotFoundError(
                f"Modelo base não encontrado: {args.model}\n"
                "Execute o treinamento inicial ou ajuste --model."
            )
        model = YOLO(args.model)
        print(f"Fine-tuning a partir de: {args.model}")

    experiment_name = args.name or ("finetune_s" if args.larger_model else "finetune")

    train_kwargs = dict(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        name=experiment_name,

        # --- Learning rate ---
        lr0=0.001,
        lrf=0.01,
        cos_lr=True,

        # --- Regularização ---
        weight_decay=0.0005,
        dropout=0.0,

        # --- Augmentation conservadora (dataset pequeno) ---
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        flipud=0.1,
        fliplr=0.5,
        degrees=5.0,
        translate=0.1,
        scale=0.5,
        mosaic=1.0,
        mixup=0.0,
        copy_paste=0.0,

        # --- Outros ---
        patience=20,
        close_mosaic=10,
        optimizer="SGD",    # SGD é mais estável que AdamW em datasets pequenos
        amp=False,          # AMP em CPU causa NaN no EMA — desabilitar
        device=DEVICE if DEVICE else None,
        workers=4,
        verbose=True,
        plots=True,
        val=True,
    )

    # Remove device=None para não sobrescrever o auto-detect do ultralytics
    if train_kwargs["device"] is None:
        del train_kwargs["device"]

    print("\nHiperparâmetros do fine-tuning:")
    for k, v in train_kwargs.items():
        print(f"  {k}: {v}")
    print()

    results = model.train(**train_kwargs)

    best_map = results.results_dict.get("metrics/mAP50-95(B)", 0)
    print(f"\nTreino concluído. mAP50-95: {best_map:.4f}")
    print(f"Melhor modelo salvo em: runs/detect/{experiment_name}/weights/best.pt")


if __name__ == "__main__":
    main()

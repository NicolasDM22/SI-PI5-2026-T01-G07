"""
Fine-tuning do best.pt com dataset aéreo de vacas.
Parte do modelo já treinado no Cows2021 e adapta para perspectiva de drone.

Uso:
    python train_aerial.py
"""

import torch
from ultralytics import YOLO


def main():
    if not torch.cuda.is_available():
        print("AVISO: GPU não detectada!")
        device = "cpu"
    else:
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        device = 0

    # parte do modelo já treinado — não do zero
    model = YOLO("best.pt")

    model.train(
        data="data_aerial.yaml",
        epochs=50,
        imgsz=640,
        batch=8,
        device=device,
        patience=15,      # para mais cedo — dataset pequeno converge rápido
        resume=False,     # fine-tuning, não resume
        name="cattle_aerial_v1",
        workers=4,
        lr0=0.001,        # learning rate menor para fine-tuning
        lrf=0.01,
        flipud=0.3,
        degrees=15.0,
        scale=0.4,
    )

    print("\nTreino concluído!")
    print("Modelo salvo em: runs/detect/cattle_aerial_v1/weights/best.pt")
    print("\nPara usar no sistema:")
    print("  copy runs\\detect\\cattle_aerial_v1\\weights\\best.pt best.pt")


if __name__ == "__main__":
    main()

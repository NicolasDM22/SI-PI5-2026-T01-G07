"""
Treina YOLOv8 com o dataset convertido.

Uso:
    python train.py
"""

import torch
from ultralytics import YOLO


def main():
    if not torch.cuda.is_available():
        print("AVISO: GPU não detectada! Rodando em CPU (muito lento).")
        device = "cpu"
    else:
        print(f"GPU detectada: {torch.cuda.get_device_name(0)}")
        device = 0

    model = YOLO("yolov8s.pt")

    model.train(
        data="data.yaml",
        epochs=150,
        imgsz=640,
        batch=8,
        device=device,
        patience=30,
        resume=True,
        name="cattle_v1",
        workers=4,
        flipud=0.3,
        degrees=15.0,
        scale=0.4,
        copy_paste=0.3,
    )

    print("\nTreino concluído!")
    print("Modelo salvo em: runs/detect/cattle_v1/weights/best.pt")
    print("\nPara usar no sistema, copie o best.pt para a raiz do projeto:")
    print("  copy runs\\detect\\cattle_v1\\weights\\best.pt best.pt")


if __name__ == "__main__":
    main()

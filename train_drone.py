"""
Fine-tuning com dataset Cattle_drone_images_042024.
Parte do melhor modelo aéreo já treinado.

Uso:
    python train_drone.py
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

    # parte do melhor modelo aéreo
    model = YOLO("runs/detect/cattle_aerial_v1/weights/best.pt")

    model.train(
        data="data_drone.yaml",
        epochs=50,
        imgsz=640,
        batch=8,
        device=device,
        patience=15,
        resume=False,
        name="cattle_drone_v1",
        workers=4,
        lr0=0.0005,   # lr ainda menor — terceiro fine-tuning
        lrf=0.01,
        flipud=0.3,
        degrees=15.0,
        scale=0.4,
    )

    print("\nTreino concluído!")
    print("Modelo salvo em: runs/detect/cattle_drone_v1/weights/best.pt")
    print("\nPara usar no sistema:")
    print("  copy runs\\detect\\cattle_drone_v1\\weights\\best.pt best.pt")


if __name__ == "__main__":
    main()


import torch
import warnings
warnings.filterwarnings('ignore')

_original_torch_load = torch.load
def _patched_torch_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)
torch.load = _patched_torch_load

from ultralytics import YOLO
import cv2
import sys

def detect_gado(image_path, confidence=0.25):
    print("=" * 70)
    print("DETECÇÃO DE GADO")
    print("=" * 70)
    print()
    
    print("[1/3] Carregando modelo YOLOv8...")
    model = YOLO('yolov8n.pt')
    print("      ✓ Modelo carregado!")
    print()
    
    print(f"[2/3] Detectando em: {image_path}")
    results = model(image_path, conf=confidence, verbose=False)
    print()
    
    print("[3/3] Processando resultados...")
    gado_count = 0
    img = cv2.imread(image_path)
    
    if img is None:
        print(f"✗ Erro ao ler imagem: {image_path}")
        return 0
    
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            
            if class_id in [18, 19]:
                gado_count += 1
                conf = float(box.conf[0])
                bbox = box.xyxy[0].tolist()
                x1, y1, x2, y2 = map(int, bbox)
                
                # Desenha retângulo verde
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Label como "Gado"
                label = f"Gado {conf:.2f}"
                cv2.putText(img, label, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                
                print(f"      ✓ Gado detectado! Confiança: {conf:.2%}")
    
    # Adiciona contador
    cv2.putText(img, f"Gado: {gado_count}", (10, 30),
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    
    # Salva imagem
    output_path = "output_gado.jpg"
    cv2.imwrite(output_path, img)
    
    print()
    print("=" * 70)
    print("RESULTADO")
    print("=" * 70)
    print(f"Gado detectado: {gado_count}")
    print(f"Imagem salva: {output_path}")
    print("=" * 70)
    print()
    
    return gado_count

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Detecta gado')
    parser.add_argument('image', help='Caminho da imagem')
    parser.add_argument('--confidence', type=float, default=0.25,
                       help='Threshold de confiança (padrão: 0.25)')
    
    args = parser.parse_args()
    
    detect_gado(args.image, args.confidence)

# Made with Bob

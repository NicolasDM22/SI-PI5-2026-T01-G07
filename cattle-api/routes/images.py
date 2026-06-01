from fastapi import APIRouter, File, HTTPException, UploadFile

from services.ai_inference import run_inference_bytes

router = APIRouter()


@router.post("/images/detect")
async def detect_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Envie um arquivo de imagem válido.")
    contents = await file.read()
    result = run_inference_bytes(contents)
    return {"count": result["count"], "annotatedImageB64": result["annotatedImageB64"]}

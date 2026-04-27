from fastapi import APIRouter, UploadFile, File

router = APIRouter()


@router.post("/")
async def upload_video(file: UploadFile = File(...)):
    ...

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_jobs():
    ...


@router.get("/{job_id}")
def get_job(job_id: int):
    ...


@router.delete("/{job_id}")
def delete_job(job_id: int):
    ...

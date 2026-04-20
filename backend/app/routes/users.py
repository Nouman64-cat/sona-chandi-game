from typing import List, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException, status
from sqlmodel import Session
from app.database.connection import get_session
from app.models.user import UserRead, UserSearchResponse, User
from app.services.user_service import UserService
from app.routes.auth import get_current_user
import boto3
import uuid
from app.config.settings import settings


router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/search", response_model=List[UserSearchResponse])
def search_users(
    query: str = Query("", min_length=0), 
    searcher_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    return UserService.search_users(session, query, searcher_id)

@router.post("/me/profile-picture", response_model=UserRead)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File provided is not an image.")

    if not settings.S3_BUCKET_NAME or not settings.IAM_USER_ACCESS_KEY or not settings.IAM_USER_SECRET_ACCESS_KEY:
        raise HTTPException(status_code=500, detail="S3 configuration is incomplete.")

    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.IAM_USER_ACCESS_KEY,
        aws_secret_access_key=settings.IAM_USER_SECRET_ACCESS_KEY
    )

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"profile_pictures/{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"

    try:
        s3_client.upload_fileobj(
            file.file,
            settings.S3_BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": file.content_type}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

    image_url = f"https://{settings.S3_BUCKET_NAME}.s3.amazonaws.com/{filename}"
    
    current_user.profile_picture_url = image_url
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return current_user


import os
import logging
import cloudinary
import cloudinary.uploader

logger = logging.getLogger(__name__)

def upload_image_to_cloudinary(image_url: str) -> str:
    """
    Uploads an image URL to Cloudinary and returns the hosted secure URL.
    Falls back to the original image URL if configuration is missing or upload fails.
    """
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    folder = os.getenv("CLOUDINARY_FOLDER", "shipstory")
    
    if not all([cloud_name, api_key, api_secret]):
        logger.warning("[Cloudinary] Credentials missing in environment. Returning original URL.")
        return image_url

    try:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        logger.info(f"[Cloudinary] Uploading image {image_url} to folder: {folder}...")
        result = cloudinary.uploader.upload(
            image_url,
            folder=folder
        )
        secure_url = result.get("secure_url")
        if secure_url:
            logger.info(f"[Cloudinary] Upload successful: {secure_url}")
            return secure_url
        else:
            logger.warning("[Cloudinary] Upload response did not contain secure_url. Returning original URL.")
            return image_url
    except Exception as e:
        logger.error(f"[Cloudinary] Upload failed with error: {e}. Returning original URL.")
        return image_url

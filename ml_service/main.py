from fastapi import FastAPI, Request
from gee_auth import init_gee
from change_detector import detect_change, get_latest_image_info, get_latest_image_download_url
from models import DetectRequest, DetectResponse

app = FastAPI()
init_gee()

@app.post("/detect-change", response_model=DetectResponse)
def detect(request: DetectRequest):
    """
    Detects change in the provided plot coordinates using NDVI.
    Parameters:
      - threshold: NDVI change threshold (default 0.2)
      - days: Number of days to look back (default 20)
      - relax_mask: If true, only mask clouds and shadows (default False)
      - apply_mask: If false, disables masking (default True)
    Returns change area and polygons if detected.
    """
    try:
        result = detect_change(
            request.coordinates,
            threshold=request.threshold,
            days=request.days,
            relax_mask=request.relax_mask,
            apply_mask=request.apply_mask
        )
        return {
            "plotId": request.plotId,
            **result
        }
    except Exception as e:
        return {
            "plotId": request.plotId,
            "change_detected": False,
            "change_area": 0,
            "change_geojson": {},
            "error": str(e)
        }

@app.post("/latest-image")
def latest_image(request: DetectRequest, relax_mask: bool = True, apply_mask: bool = True):
    """
    Returns metadata for the 3 most recent cloud-free Sentinel-2 images for the given coordinates.
    Query params:
      - relax_mask: If true, only mask clouds and shadows (default: true)
      - apply_mask: If false, disables masking (default: true)
    """
    return get_latest_image_info(request.coordinates, relax_mask=relax_mask, apply_mask=apply_mask)

@app.post("/download-latest-image")
def download_latest_image(request: DetectRequest, relax_mask: bool = True, apply_mask: bool = True):
    """
    Returns download URLs for the 3 most recent cloud-free Sentinel-2 images for the given coordinates.
    Query params:
      - relax_mask: If true, only mask clouds and shadows (default: true)
      - apply_mask: If false, disables masking (default: true)
    """
    return get_latest_image_download_url(request.coordinates, relax_mask=relax_mask, apply_mask=apply_mask)

@app.get("/health-check")
def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok"}

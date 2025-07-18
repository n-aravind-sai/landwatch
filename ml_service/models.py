from pydantic import BaseModel
from typing import List

class DetectRequest(BaseModel):
    """
    Request model for change detection API.
    plotId: Unique identifier for the plot.
    coordinates: Polygon coordinates [[[lon, lat], ...]].
    threshold: NDVI change threshold (default 0.2).
    days: Number of days to look back (default 20).
    relax_mask: If true, only mask clouds and shadows (default False).
    apply_mask: If false, disables masking (default True).
    """
    plotId: str
    coordinates: List[List[List[float]]]  # Polygon: [[[lon, lat], ...]]
    threshold: float = 0.2
    days: int = 20
    relax_mask: bool = False
    apply_mask: bool = True

class DetectResponse(BaseModel):
    """
    Response model for change detection API.
    plotId: Unique identifier for the plot.
    change_detected: Whether change was detected.
    change_area: Area of detected change (hectares).
    change_geojson: GeoJSON of detected change polygons.
    """
    plotId: str
    change_detected: bool
    change_area: float
    change_geojson: dict

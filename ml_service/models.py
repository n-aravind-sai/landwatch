from pydantic import BaseModel
from typing import List

class DetectRequest(BaseModel):
    """
    Request model for change detection API.
    plotId: Unique identifier for the plot.
    coordinates: Polygon coordinates [[[lon, lat], ...]].
    """
    plotId: str
    coordinates: List[List[List[float]]]  # Polygon: [[[lon, lat], ...]]

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

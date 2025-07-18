import ee  # ✅ Import only ee
import math

# Improved SCL-based cloud/shadow/snow masking for Sentinel-2
SCL_CLOUD_CLASSES = [3, 7, 8, 9, 10, 11]  # 3=Shadow, 7=Unclassified, 8=Cloud medium, 9=Cloud high, 10=Thin cirrus, 11=Snow

def mask_s2_clouds_shadows(img, aoi, relax_mask=True, apply_mask=True):
    scl = img.select('SCL')
    if not apply_mask:
        return img.clip(aoi)
    if relax_mask:
        # Only mask clouds (8, 9, 10) and shadows (3)
        mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))
    else:
        # Mask clouds, shadows, snow, unclassified
        mask = ee.Image(1)
        for val in SCL_CLOUD_CLASSES:
            mask = mask.And(scl.neq(val))
    return img.updateMask(mask).clip(aoi)

def compute_ndvi(img: ee.image.Image) -> ee.image.Image:
    """
    Computes the NDVI for a given Sentinel-2 image.
    Args:
        img (ee.Image): Sentinel-2 image.
    Returns:
        ee.Image: NDVI image.
    """
    return img.normalizedDifference(['B8', 'B4']).rename('NDVI')

def detect_change(
    polygon_coords: list,
    threshold: float = 0.2,
    days: int = 20,
    relax_mask: bool = False,
    apply_mask: bool = True
) -> dict:
    """
    Improved: Uses median composites for before/after, robust SCL masking, and exposes params.
    """
    try:
        aoi = ee.Geometry.Polygon(polygon_coords)
        today = ee.Date(ee.Date.now())
        before = today.advance(-days, 'day')

        def add_mask(img):
            return mask_s2_clouds_shadows(img, aoi, relax_mask=relax_mask, apply_mask=apply_mask)

        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(aoi)
            .filterDate(before, today)
            .map(add_mask)
        )
        # Check image count
        if collection.size().getInfo() < 2:
            return {
                "change_detected": False,
                "change_area": 0,
                "change_geojson": {},
                "bounding_box": aoi.bounds().getInfo().get("coordinates", []),
                "percentChange": 0,
                "type": "change"
            }
        # Use median composite for before/after
        mid = before.advance(days // 2, 'day')
        before_coll = collection.filterDate(before, mid)
        after_coll = collection.filterDate(mid, today)
        if before_coll.size().getInfo() == 0 or after_coll.size().getInfo() == 0:
            return {
                "change_detected": False,
                "change_area": 0,
                "change_geojson": {},
                "bounding_box": aoi.bounds().getInfo().get("coordinates", []),
                "percentChange": 0,
                "type": "change"
            }
        img1 = before_coll.median()
        img2 = after_coll.median()
        ndvi1 = compute_ndvi(img1)
        ndvi2 = compute_ndvi(img2)
        # Calculate mean NDVI change over AOI
        mean1 = ndvi1.reduceRegion(ee.Reducer.mean(), aoi, 10).get('NDVI').getInfo() or 0
        mean2 = ndvi2.reduceRegion(ee.Reducer.mean(), aoi, 10).get('NDVI').getInfo() or 0
        percent_change = round(abs(mean2 - mean1) * 100, 2)
        delta = ndvi2.subtract(ndvi1).abs().gt(threshold)
        # Convert raster difference to vector polygons
        vectors = delta.selfMask().reduceToVectors({
            "geometry": aoi,
            "scale": 10,
            "geometryType": "polygon",
            "eightConnected": False,
            "maxPixels": 1e8
        })
        geojson_data = vectors.getInfo()
        features = geojson_data.get("features", [])
        num_changes = len(features)
        total_area = sum([
            ee.Geometry(f["geometry"]).area().getInfo() or 0
            for f in features
        ])
        return {
            "change_detected": num_changes > 0,
            "change_area": round(total_area / 10_000, 4),  # in hectares
            "change_geojson": geojson_data,
            "bounding_box": aoi.bounds().getInfo().get("coordinates", []),
            "percentChange": percent_change,
            "type": "change"
        }
    except Exception as e:
        return {
            "change_detected": False,
            "change_area": 0,
            "change_geojson": {},
            "bounding_box": [],
            "error": str(e),
            "percentChange": 0,
            "type": "change"
        }

def get_latest_image_info(polygon_coords: list, relax_mask=True, apply_mask=True) -> dict:
    """
    Returns the thumbnail URL for the most recent cloud-free Sentinel-2 image for the given coordinates, with SCL-based cloud/shadow masking and clipped to AOI.
    Args:
        polygon_coords (list): Coordinates for the AOI polygon.
        relax_mask (bool): If True, only mask clouds and shadows. If False, mask more classes.
        apply_mask (bool): If False, do not apply any mask (debugging).
    Returns:
        dict: The thumbnail URL for the most recent image.
    """
    try:
        aoi = ee.Geometry.Polygon(polygon_coords)
        bounds = aoi.bounds().getInfo()['coordinates'][0]
        min_lon = min([pt[0] for pt in bounds])
        max_lon = max([pt[0] for pt in bounds])
        min_lat = min([pt[1] for pt in bounds])
        max_lat = max([pt[1] for pt in bounds])
        width_m = 111320 * abs(max_lon - min_lon) * math.cos(math.radians((min_lat + max_lat) / 2))
        height_m = 110540 * abs(max_lat - min_lat)
        max_dim = max(width_m, height_m)
        # At 10m per pixel
        dim = int(max_dim / 10)
        dim = max(32, min(dim, 512))
        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(aoi)
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40))
            .sort('system:time_start', False)
        )
        images = collection.toList(3)
        if images.size().getInfo() == 0:
            return {'best_thumbnail_url': None, 'error': 'No recent cloud-free images found.'}
        # Always use the first image (most recent)
        img = ee.Image(images.get(0))
        masked = mask_s2_clouds_shadows(img, aoi, relax_mask=relax_mask, apply_mask=apply_mask)
        thumbnail_params = {
            'dimensions': dim,
            'region': aoi,
            'format': 'png',
            'bands': ['B4', 'B3', 'B2'],
            'min': 0,
            'max': 3000
        }
        url = masked.getThumbURL(thumbnail_params)
        return {'best_thumbnail_url': url}
    except Exception as e:
        return {'error': str(e)}

def get_latest_image_download_url(polygon_coords: list, relax_mask=True, apply_mask=True) -> dict:
    """
    Returns the download URL for the most recent cloud-free Sentinel-2 image for the given coordinates, cloud-masked, at native resolution (GeoTIFF).
    Args:
        polygon_coords (list): Coordinates for the AOI polygon.
        relax_mask (bool): If True, only mask clouds and shadows. If False, mask more classes.
        apply_mask (bool): If False, do not apply any mask (debugging).
    Returns:
        dict: The download URL for the most recent cloud-free image.
    """
    try:
        aoi = ee.Geometry.Polygon(polygon_coords)
        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(aoi)
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40))
            .sort('system:time_start', False)
        )
        images = collection.toList(1)
        if images.size().getInfo() == 0:
            return {'download_url': None, 'error': 'No recent cloud-free images found.'}
        img = ee.Image(images.get(0))
        masked = mask_s2_clouds_shadows(img, aoi, relax_mask=relax_mask, apply_mask=apply_mask)
        url = masked.getDownloadURL({
            'scale': 10,
            'region': aoi,
            'format': 'GEO_TIFF',
            'bands': ['B4', 'B3', 'B2'],
            'min': 0,
            'max': 3000
        })
        return {'download_url': url}
    except Exception as e:
        return {'error': str(e)}

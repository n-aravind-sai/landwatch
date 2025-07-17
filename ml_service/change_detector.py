import ee  # ✅ Import only ee
import math

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
    days: int = 20
) -> dict:
    """
    Detects NDVI change in a given polygon area over the specified number of days.
    Args:
        polygon_coords (list): Coordinates for the AOI polygon.
        threshold (float): NDVI change threshold.
        days (int): Number of days to look back.
    Returns:
        dict: Change detection results.
    """
    try:
        aoi = ee.Geometry.Polygon(polygon_coords)
        today = ee.Date(ee.Date.now())  # type: ignore
        before = today.advance(-days, 'day')

        # ✅ Use better cloud masking if needed
        def mask_clouds(img):
            qa = img.select('QA60')
            return img.updateMask(qa.bitwiseAnd(1 << 10).eq(0))

        # ✅ ImageCollection with ignore
        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(aoi)
            .filterDate(before, today)
            .map(mask_clouds)
        )

        # ✅ Check image count
        if collection.size().getInfo() < 2:
            return {
                "change_detected": False,
                "change_area": 0,
                "change_geojson": {},
                "bounding_box": aoi.bounds().getInfo().get("coordinates", [])
            }

        # ✅ Select earliest and latest images
        images = collection.sort("system:time_start").toList(2)
        img1 = ee.Image(images.get(0))  # type: ignore
        img2 = ee.Image(images.get(1))  # type: ignore

        ndvi1 = compute_ndvi(img1)
        ndvi2 = compute_ndvi(img2)
        delta = ndvi2.subtract(ndvi1).abs().gt(threshold)

        # ✅ Convert raster difference to vector polygons
        vectors = delta.selfMask().reduceToVectors({  # type: ignore
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
            "bounding_box": aoi.bounds().getInfo().get("coordinates", [])
        }
    except Exception as e:
        return {
            "change_detected": False,
            "change_area": 0,
            "change_geojson": {},
            "bounding_box": [],
            "error": str(e)
        }

def mask_s2_clouds_shadows(img, aoi, relax_mask=True, apply_mask=True):
    scl = img.select('SCL')
    if not apply_mask:
        return img.clip(aoi)
    if relax_mask:
        # Only mask clouds (8, 9, 10) and shadows (3)
        mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))
    else:
        # Mask clouds, shadows, snow, unclassified
        mask = scl.neq(3).And(scl.neq(7)).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10)).And(scl.neq(11))
    return img.updateMask(mask).clip(aoi)

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
    Returns download URLs for the 3 most recent cloud-free Sentinel-2 images for the given coordinates, cloud-masked, at native resolution (GeoTIFF).
    Args:
        polygon_coords (list): Coordinates for the AOI polygon.
        relax_mask (bool): If True, only mask clouds and shadows. If False, mask more classes.
        apply_mask (bool): If False, do not apply any mask (debugging).
    Returns:
        dict: List of download URLs for the 3 most recent cloud-free images.
    """
    try:
        aoi = ee.Geometry.Polygon(polygon_coords)
        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(aoi)
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40))
            .sort('system:time_start', False)
        )
        images = collection.toList(3)
        results = []
        for i in range(3):
            img = ee.Image(images.get(i))
            masked = mask_s2_clouds_shadows(img, aoi, relax_mask=relax_mask, apply_mask=apply_mask)
            info = img.getInfo()
            url = masked.getDownloadURL({
                'scale': 10,
                'region': aoi,
                'format': 'GEO_TIFF',
                'bands': ['B4', 'B3', 'B2']
            })
            results.append({
                'id': info.get('id'),
                'date': info['properties'].get('DATATAKE_IDENTIFIER'),
                'bands': [b['id'] for b in info['bands']],
                'properties': info['properties'],
                'download_url': url
            })
        return {'images': results}
    except Exception as e:
        return {'error': str(e)}

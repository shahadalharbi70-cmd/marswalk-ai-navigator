"""
export_terrain.py  -  Converts QGIS outputs (elevation + slope) into data/terrain.json and data/science-sites.json
"""
import os
import json
import numpy as np

# ====== Paths & Metadata configured for your Mac ======
ELEV_TIF    = "/Users/fajralmutairi/Desktop/elevation_20m.tif"
SLOPE_TIF   = "/Users/fajralmutairi/Desktop/slope_20m.tif"
OUT_TERRAIN = "/Users/fajralmutairi/Desktop/data/terrain.json"
OUT_SITES   = "/Users/fajralmutairi/Desktop/data/science-sites.json"

REGION  = "Jezero Crater Western Fan"
SOURCE  = "USGS Mars 2020 Science Investigation CTX DEM Mosaic (M20_JezeroCrater_CTXDEM_20m.tif)"

SITES = [
    {
        "id": "site-a",
        "name": "Hawksbill Gap",
        "lat": 18.388,
        "lon": 77.452,
        "scienceValue": 5,
        "reason": "Sedimentary delta front exposure containing fine-grained mudstones and sulfates with high biosignature preservation potential.",
        "sourceUrl": "https://science.nasa.gov/mission/mars-2020-perseverance/science/"
    },
    {
        "id": "site-b",
        "name": "Séítah",
        "lat": 18.362,
        "lon": 77.478,
        "scienceValue": 4,
        "reason": "Fractured, ridged bedrock terrain rich in olivine and carbonate minerals, key for understanding early aqueous alteration.",
        "sourceUrl": "https://science.nasa.gov/mission/mars-2020-perseverance/science/"
    },
]
# ======================================================

def hazard(deg):
    """Project slope hazard thresholds: <8 low, <15 medium, <20 high, >=20 impassable"""
    if deg < 8:  return "low"
    if deg < 15: return "medium"
    if deg < 20: return "high"
    return "impassable"

def build_grids(elev, slope):
    """Returns (elevation, slope, hazardLevel) as lists; NaN becomes null/None."""
    if elev.shape != slope.shape:
        raise ValueError("DEM shape %s differs from Slope shape %s - both must come from the same raster"
                         % (elev.shape, slope.shape))
    el  = [[None if np.isnan(v) else round(float(v), 1) for v in row] for row in elev]
    sl  = [[None if np.isnan(v) else round(float(v), 1) for v in row] for row in slope]
    hz  = [[None if np.isnan(v) else hazard(float(v))   for v in row] for row in slope]
    return el, sl, hz

def _read(path):
    from osgeo import gdal
    ds = gdal.Open(path)
    if ds is None:
        raise FileNotFoundError(path)
    b = ds.GetRasterBand(1)
    a = b.ReadAsArray().astype("float64")
    nd = b.GetNoDataValue()
    if nd is not None:
        a[a == nd] = np.nan
    return ds, a

def main():
    from osgeo import osr
    os.makedirs(os.path.dirname(OUT_TERRAIN), exist_ok=True)
    
    ds, elev = _read(ELEV_TIF)
    ds2, slope = _read(SLOPE_TIF)
    gt = ds.GetGeoTransform()
    if ds2.GetGeoTransform() != gt:
        raise ValueError("DEM and Slope rasters are not aligned on the same grid")
    if gt[2] != 0 or gt[4] != 0:
        raise ValueError("Raster is rotated; reproject it first")
    srs = osr.SpatialReference(); srs.ImportFromWkt(ds.GetProjection())
    if not srs.IsProjected() or abs(srs.GetLinearUnits() - 1.0) > 1e-9:
        raise ValueError("Raster must use a metric projection (meters). Reproject in QGIS (Raster > Projections > Warp).")
    if abs(gt[1] + gt[5]) > 1e-6:
        raise ValueError("Pixels are not square: %s x %s" % (gt[1], -gt[5]))
    geo = srs.CloneGeogCS()
    for s in (srs, geo):
        s.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)   # (lon, lat)
    to_geo  = osr.CoordinateTransformation(srs, geo)
    to_proj = osr.CoordinateTransformation(geo, srs)

    rows, cols = elev.shape
    corners = [to_geo.TransformPoint(gt[0] + c * gt[1], gt[3] + r * gt[5])[:2]
               for r in (0, rows) for c in (0, cols)]
    lons = [p[0] for p in corners]; lats = [p[1] for p in corners]
    el, sl, hz = build_grids(elev, slope)
    terrain = {
        "metadata": {
            "region": REGION, "source": SOURCE,
            "boundingBox": {"north": round(max(lats), 5), "south": round(min(lats), 5),
                            "west": round(min(lons), 5),  "east": round(max(lons), 5)},
            "origin": {"lat": round(lats[0], 5), "lon": round(lons[0], 5)},   # Northwest corner
            "cellSizeM": gt[1], "rows": rows, "cols": cols,
            "indexBase": 0, "rowOrder": "row 0 = north, col 0 = west",
            "hazardThresholdsDeg": {"medium": 8, "high": 15, "impassable": 20},
        },
        "elevation": el, "slope": sl, "hazardLevel": hz,
    }
    with open(OUT_TERRAIN, "w", encoding="utf-8") as f:
        json.dump(terrain, f, ensure_ascii=False, separators=(",", ":"))

    out_sites = []
    for s in SITES:
        x, y = to_proj.TransformPoint(s["lon"], s["lat"])[:2]
        col = int((x - gt[0]) // gt[1]); row = int((y - gt[3]) // gt[5])
        if not (0 <= row < rows and 0 <= col < cols):
            raise ValueError("Site %s is outside the grid (row=%d, col=%d, grid %dx%d). "
                             "Check coordinates or widen the clip extent." % (s["name"], row, col, rows, cols))
        out_sites.append({"id": s["id"], "name": s["name"], "row": row, "col": col,
                          "lat": s["lat"], "lon": s["lon"], "scienceValue": s["scienceValue"],
                          "reason": s["reason"], "sourceUrl": s["sourceUrl"],
                          "hazardAtSite": hz[row][col]})
    with open(OUT_SITES, "w", encoding="utf-8") as f:
        json.dump(out_sites, f, ensure_ascii=False, indent=2)
    print("OK:", rows, "x", cols, "cells @", gt[1], "m ->", OUT_TERRAIN)
    for s in out_sites:
        print(" ", s["name"], "row", s["row"], "col", s["col"], "hazard:", s["hazardAtSite"])

if __name__ == "__main__":
    main()

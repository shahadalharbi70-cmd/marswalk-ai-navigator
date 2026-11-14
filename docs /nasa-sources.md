# NASA Data Sources and Processing Methodology

## Overview
This document outlines the planetary data sources, mission instruments, and data processing workflows utilized by Role #2 (NASA Data & Terrain Analysis) for the **MarsWalk AI Navigator** project[cite: 27]. All elevation and imagery datasets originate from publicly accessible NASA and USGS planetary archives[cite: 27].

---

## 1. Primary Data Sources & Mission Metadata

### A. Mars Reconnaissance Orbiter (MRO) – CTX Elevation Mosaic
* **Mission Name:** Mars Reconnaissance Orbiter (MRO)[cite: 27]
* **Launch Date:** August 12, 2005[cite: 27]
* **Instrument Used:** Context Camera (CTX) — provides regional grayscale image mosaics (approx. 6 meters/pixel) and stereo elevation products[cite: 24, 27]
* **Elevation Dataset:** USGS Mars 2020 Science Investigation CTX DEM Mosaic (`M20_JezeroCrater_CTXDEM_20m.tif`, 20 m/pixel)[cite: 25]
* **Data Repository (Elevation):** USGS Astrogeology Science Center / NASA Planetary Data System (PDS)[cite: 27]
* **URL (Elevation Data):** https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic[cite: 27]
* **Data Repository (Map View):** NASA Mars Trek Geospatial Portal[cite: 27]
* **URL (Map Image):** https://trek.nasa.gov/mars/[cite: 27]
* *Source: Calef (2021); NASA/JPL Solar System Treks Project (n.d.)*[cite: 24, 28]

### B. Mars 2020 Perseverance Rover Mission
* **Mission Name:** Mars 2020 Perseverance Rover[cite: 27]
* **Landing Date:** February 18, 2021[cite: 27]
* **Landing Site:** Jezero Crater (Octavia E. Butler Landing — 18.4447° N, 77.4508° E)[cite: 27]
* **Scientific Focus:** Astrobiology, caching samples of Martian rock and regolith, characterizing Jezero's climate and geology, and paving the way for human exploration[cite: 27].
* **URL:** https://mars.nasa.gov/mars2020/[cite: 27]
* *Source: Farley et al. (2020)*[cite: 23, 28]

---

## 2. Data Processing Workflow

### 1. Spatial Bounding & Map Reference
* Queried **NASA Mars Trek** centered on Jezero Crater (`18.39° N, 77.45° E`) and captured the orbital base map view with the Perseverance traverse overlay[cite: 27].
* Defined the study area bounding box (`18.355–18.435° N`, `77.410–77.520° E`) in QGIS to reduce computational overhead for AI pathfinding[cite: 27].
* *Source: NASA/JPL Solar System Treks Project (n.d.); Calef (2021)*[cite: 24, 28]

### 2. Elevation and Terrain Extraction
* Downloaded the **USGS Mars 2020 Science Investigation CTX DEM Mosaic** (`M20_JezeroCrater_CTXDEM_20m.tif`), clipped it to the study area in QGIS, resampled it to `20 m × 20 m` (Average), and computed slope in degrees with the QGIS Slope tool (`Raster > Analysis > Slope`)[cite: 25, 27].
* Note: Slope values are computed on a 20 m resolution grid, resulting in a slightly smoother terrain representation compared to fine-scale surface micro-topography[cite: 25].
* Assigned project-specific hazard classes (`<8°` low, `8°–15°` medium, `15°–20°` high, `≥20°` impassable) and exported to `data/terrain.json` using `export_terrain.py`[cite: 26, 27].
* *Source: Calef (2021) — USGS Mars 2020 Science Investigation CTX DEM Mosaic*[cite: 25, 28]

### 3. Scientific Waypoint Identification
* Cross-referenced geographic coordinates with official NASA Mars 2020 traverse maps and Perseverance Delta Front science campaign waypoints (**Hawksbill Gap** at `18.388° N, 77.452° E` and **Séítah** at `18.362° N, 77.478° E`)[cite: 24, 25, 27].
* Formatted waypoint metadata into `data/science-sites.json`[cite: 28].
* *Source: NASA Mars 2020 Perseverance Science Campaign (https://science.nasa.gov/mission/mars-2020-perseverance/science/); Farley et al. (2020)*[cite: 24, 25, 28]

---

## 3. References

* Calef, F. (2021). *Mars 2020 Science Investigation CTX DEM Mosaic* [Data set]. U.S. Geological Survey, Astrogeology Science Center. https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic[cite: 28]
* Farley, K. A., Williford, K. H., Stack, K. M., et al. (2020). Mars 2020 mission overview. *Space Science Reviews*, 216, Article 142. https://doi.org/10.1007/s11214-020-00762-y[cite: 28]
* NASA/JPL Solar System Treks Project. (n.d.). *Mars Trek* [Web application]. NASA Jet Propulsion Laboratory. https://trek.nasa.gov/mars/[cite: 28]

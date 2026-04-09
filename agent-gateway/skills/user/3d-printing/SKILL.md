---
name: 3d-printing
description: Additive manufacturing and 3D printing
license: MIT
metadata:
  audience: makers
  category: engineering
---

## What I do
- Design 3D models for printing
- Select appropriate printing technologies
- Optimize prints for material and strength
- Troubleshoot printing issues
- Post-process printed parts
- Configure slicer settings

## When to use me
When creating physical prototypes, custom parts, or manufacturing with additive technologies.

## Key Concepts

### Printing Technologies
```
FDM (Fused Deposition Modeling):
- Materials: PLA, ABS, PETG, TPU, Nylon
- Low cost, accessible
- Good for prototypes

SLA (Stereolithography):
- Materials: UV resin
- High resolution, smooth finish
- Ideal for detailed parts

SLS (Selective Laser Sintering):
- Materials: Nylon, TPU powder
- Strong, functional parts
- No support structures needed

Metal 3D Printing:
- DMLS, SLM
- Aerospace, medical applications
- High cost, high performance
```

### Design Guidelines
```
Wall Thickness: Minimum 0.8mm (FDM)
Overhangs: Limit to 45° or use supports
Tolerances: 0.3-0.5mm for fits
Orientation: Strength varies by axis
Infill: 20-100% depending on use
```

### Slicer Settings
```python
# Key parameters
layer_height: 0.12-0.28mm
print_speed: 40-80mm/s
temperature: 200-260°C (PLA/ABS)
bed_temperature: 60-110°C
retraction: 4-8mm distance
```

### Troubleshooting
```
Layer separation: Increase temperature
Stringing: Adjust retraction
Warping: Use glue stick, heated bed
Clogging: Clean nozzle, reduce temp
Poor adhesion: Level bed, clean surface
```

### File Formats
- STL: Standard for 3D printing
- OBJ: With textures
- AMF: With material info
- G-code: Printer instructions

### Post-Processing
- Sanding and smoothing
- Painting and finishing
- Acetone smoothing (ABS)
- Epoxy coating
- Support removal

---
name: cad-cam
description: CAD/CAM fundamentals including geometric modeling, manufacturing automation, toolpath generation, CNC programming, and 3D printing
license: MIT
compatibility: opencode
metadata:
  audience: engineers
  category: engineering
---

## What I do
- Create 3D geometric models using CAD software
- Generate CNC toolpaths for manufacturing
- Program CNC machines using G-code and CAM software
- Design for additive manufacturing (3D printing)
- Perform toolpath simulation and verification
- Optimize machining parameters for efficiency
- Convert CAD models to manufacturing formats
- Verify tool collision and machine limits

## When to use me
When creating 3D models, generating CNC toolpaths, programming CNC machines, or designing parts for additive manufacturing.

## Core Concepts
- Solid modeling (CSG, B-rep)
- Surface modeling and NURBS
- Feature-based modeling
- Toolpath strategies (contour, pocketing, drilling)
- CNC programming (G-code, M-code)
- Feed and speed calculations
- Tool geometry and compensation
- Additive manufacturing processes (FDM, SLA, SLS)
- Build orientation and support generation
- Post-processing for different machine controllers

## Code Examples

### G-Code Generation
```python
from dataclasses import dataclass
from typing import List, Tuple
import math

@dataclass
class GCodeCommand:
    code: str
    x: float = None
    y: float = None
    z: float = None
    f: float = None
    s: float = None

def rapid_move(x: float, y: float, z: float) -> str:
    """Generate G0 rapid move command."""
    return f"G0 X{x:.4f} Y{y:.4f} Z{z:.4f}"

def linear_move(x: float, y: float, z: float, f: float) -> str:
    """Generate G1 linear move command."""
    return f"G1 X{x:.4f} Y{y:.4f} Z{z:.4f} F{f:.1f}"

def circular_move(
    i: float, j: float, x: float, y: float,
    direction: str = "clockwise",
    f: float = 100
) -> str:
    """Generate G2/G3 circular move."""
    g_code = "G2" if direction == "clockwise" else "G3"
    return f"{g_code} X{x:.4f} Y{y:.4f} I{i:.4f} J{j:.4f} F{f:.1f}"

def drill_cycle(
    x: float, y: float,
    z_start: float,
    z_depth: float,
    z_retract: float,
    f_plunge: float,
    f_rapid: float
) -> List[str]:
    """Generate G81 drilling cycle."""
    return [
        rapid_move(x, y, z_start),
        f"G81 R{z_retract} Z{z_depth} F{f_plunge}",
        f"G80",
        rapid_move(x, y, z_retract)
    ]

def canned_cycle(
    cycle: str,
    x: float, y: float,
    r: float, z: float,
    q: float = None,
    f: float = 100
) -> str:
    """Generate canned cycle command."""
    if q:
        return f"{cycle} R{r} Z{z} Q{q} F{f}"
    return f"{cycle} R{r} Z{z} F{f}"

# Example: Simple part program
gcode = [
    "G90 G21 G40",  # Absolute, mm, cancel compensation
    "G54",  # Work coordinate system 1
    "M6 T1",  # Tool change to tool 1
    "M3 S3000",  # Spindle on clockwise 3000 RPM
    rapid_move(0, 0, 5),
    linear_move(10, 0, -2, 100),
    linear_move(10, 10, -2, 100),
    linear_move(0, 10, -2, 100),
    linear_move(0, 0, -2, 100),
    "M5",  # Spindle off
    "M30"  # Program end
]
for line in gcode[:5]:
    print(line)
```

### Toolpath Generation
```python
from typing import List, Tuple
import numpy as np

def offset_polygon(
    vertices: List[Tuple[float, float]],
    offset: float,
    corner_style: str = "round"
) -> List[Tuple[float, float]]:
    """Generate offset contour for tool radius compensation."""
    offset_vertices = []
    n = len(vertices)
    
    for i in range(n):
        p1 = vertices[i]
        p2 = vertices[(i + 1) % n]
        p0 = vertices[(i - 1) % n]
        
        v1 = np.array(p2) - np.array(p1)
        v0 = np.array(p1) - np.array(p0)
        
        angle1 = math.atan2(v1[1], v1[0])
        angle0 = math.atan2(v0[1], v0[0])
        
        if corner_style == "round":
            radius = offset
            center = np.array(p1) + np.array([
                radius * math.cos((angle0 + angle1) / 2),
                radius * math.sin((angle0 + angle1) / 2)
            ])
            # Generate arc points
            for t in np.linspace(0, 1, 9):
                angle = angle0 + (angle1 - angle0) * t
                offset_vertices.append((
                    center[0] + radius * math.cos(angle + math.pi/2),
                    center[1] + radius * math.sin(angle + math.pi/2)
                ))
        else:
            # Miter join
            bisector = (angle0 + angle1) / 2
            offset_vertices.append((
                p1[0] + offset * math.cos(bisector + math.pi/2),
                p1[1] + offset * math.sin(bisector + math.pi/2)
            ))
    
    return offset_vertices

def raster_toolpath(
    bbox: Tuple[float, float, float, float],
    stepover: float,
    direction: str = "x"
) -> List[Tuple[float, float]]:
    """Generate raster (zigzag) toolpath."""
    xmin, xmax, ymin, ymax = bbox
    path = []
    
    if direction == "x":
        for y in np.arange(ymin, ymax, stepover):
            if (y - ymin) / stepover % 2 == 0:
                path.extend([(xmin, y), (xmax, y)])
            else:
                path.extend([(xmax, y), (xmin, y)])
    else:
        for x in np.arange(xmin, xmax, stepover):
            if (x - xmin) / stepover % 2 == 0:
                path.extend([(x, ymin), (x, ymax)])
            else:
                path.extend([(x, ymax), (x, ymin)])
    
    return path

def spiral_toolpath(
    center: Tuple[float, float],
    start_radius: float,
    end_radius: float,
    angle_per_step: float = 0.1,
    z_feed: float = 0.01
) -> List[Tuple[float, float, float]]:
    """Generate spiral toolpath for drilling/milling."""
    path = []
    r = start_radius
    theta = 0
    
    while r <= end_radius:
        x = center[0] + r * math.cos(theta)
        y = center[1] + r * math.sin(theta)
        z = -r / end_radius * 5  # Example z-depth
        path.append((x, y, z))
        r += 0.05
        theta += angle_per_step
    
    return path

def trochoidal_milling(
    center: Tuple[float, float],
    radius: float,
    slot_width: float,
    stepdown: float,
    total_depth: float
) -> List[Tuple[float, float, float]]:
    """Generate trochoidal milling toolpath."""
    path = []
    current_depth = 0
    
    while current_depth < total_depth:
        current_depth += stepdown
        if current_depth > total_depth:
            current_depth = total_depth
        
        angle = 0
        while angle < 2 * math.pi:
            x = center[0] + (radius + slot_width/2 * math.cos(angle)) * math.cos(angle/2)
            y = center[1] + (radius + slot_width/2 * math.cos(angle)) * math.sin(angle/2)
            z = -current_depth
            path.append((x, y, z))
            angle += 0.2
    
    return path

# Example: Raster toolpath
bbox = (0, 100, 0, 50)
path = raster_toolpath(bbox, 10, "x")
print(f"Generated {len(path)} path points")
```

### Feeds and Speeds
```python
@dataclass
class ToolParameters:
    diameter: float  # mm
    num_flutes: int
    material: str
    hardness: float  # HRC

@dataclass
class MaterialProperties:
    name: str
    hardness: float  # HB or HRC
    tensile_strength: float  # MPa
    machinability_rating: float

def calculate_spindle_speed(
    cutting_speed: float,
    tool_diameter: float
) -> float:
    """Calculate spindle RPM."""
    return (1000 * cutting_speed) / (math.pi * tool_diameter)

def calculate_feed_rate(
    spindle_speed: float,
    feed_per_tooth: float,
    num_flutes: int
) -> float:
    """Calculate feed rate mm/min."""
    return spindle_speed * feed_per_tooth * num_flutes

def calculate_material_removal_rate(
    width: float,
    depth: float,
    feed_rate: float
) -> float:
    """Calculate MRR mm³/min."""
    return width * depth * feed_rate

def calculate_power_requirement(
    mrr: float,
    specific_energy: float
) -> float:
    """Calculate cutting power kW."""
    return mrr * specific_energy / 60000

def estimate_feeds_speeds(
    material: str,
    tool_diameter: float,
    num_flutes: int,
    operation: str
) -> dict:
    """Estimate feeds and speeds based on material and operation."""
    material_data = {
        "aluminum": {"vc": 200, "fz": 0.08, "se": 600},
        "steel": {"vc": 100, "fz": 0.04, "se": 1500},
        "stainless": {"vc": 70, "fz": 0.03, "se": 1800},
        "titanium": {"vc": 50, "fz": 0.02, "se": 2500}
    }
    
    modifiers = {
        "roughing": {"vc_mult": 1.2, "fz_mult": 1.2},
        "finishing": {"vc_mult": 1.5, "fz_mult": 0.5},
        "slotting": {"vc_mult": 0.6, "fz_mult": 0.8}
    }
    
    m = material_data.get(material, material_data["steel"])
    op_mod = modifiers.get(operation, {"vc_mult": 1.0, "fz_mult": 1.0})
    
    vc = m["vc"] * op_mod["vc_mult"]
    fz = m["fz"] * op_mod["fz_mult"]
    
    n = calculate_spindle_speed(vc)
    vf, tool_diameter = calculate_feed_rate(n, fz, num_flutes)
    
    return {
        "spindle_speed_rpm": n,
        "feed_rate_mm_min": vf,
        "chip_load_mm_tooth": fz
    }

# Example: Feeds and speeds
settings = estimate_feeds_speeds("aluminum", 10, 4, "roughing")
print(f"Spindle speed: {settings['spindle_speed_rpm']:.0f} RPM")
print(f"Feed rate: {settings['feed_rate_mm_min']:.1f} mm/min")
```

### Additive Manufacturing
```python
@dataclass
class AMBuildSettings:
    layer_height: float  # mm
    infill_percentage: float
    infill_pattern: str
    build_temperature: float  # C
    bed_temperature: float  # C
    print_speed: float  # mm/s
    support_type: str

def estimate_build_time(
    num_layers: int,
    layer_area: float,
    print_speed: float,
    travel_speed: float = 150,
    layer_change_time: float = 5
) -> float:
    """Estimate total build time in hours."""
    print_time = (num_layers * layer_area) / print_speed / 60
    travel_factor = 0.3
    layer_time = num_layers * layer_change_time / 60
    return (print_time * (1 + travel_factor) + layer_time) / 60

def calculate_material_usage(
    volume_mm3: float,
    infill_percentage: float = 20,
    support_percentage: float = 10
) -> float:
    """Calculate required material in grams."""
    density = 1.24  # PLA g/cm³
    volume_cm3 = volume_mm3 / 1000
    total_volume = volume_cm3 * (1 + infill_percentage/100) * (1 + support_percentage/100)
    return total_volume * density

def optimize_build_orientation(
    surface_area: float,
    build_volume: Tuple[float, float, float],
    min_surface_roughness: bool = True,
    max_strength: bool = False
) -> Tuple[float, float, float]:
    """Optimize part orientation for 3D printing."""
    x, y, z = build_volume
    
    if min_surface_roughness:
        return (x, y, 0.1)  # Largest flat surface down
    elif max_strength:
        return (0.1, y, z)  # Layer lines perpendicular to load
    return (x, y, z)

def generate_support_structure(
    overhang_angle_threshold: float = 45,
    support_density: float = 0.2
) -> List[dict]:
    """Generate support structure parameters."""
    return [{
        "angle_threshold": overhang_angle_threshold,
        "density": support_density,
        "style": "tree" if support_density < 0.15 else "grid"
    }]

# Example: Build estimation
build = AMBuildSettings(
    layer_height=0.2,
    infill_percentage=20,
    infill_pattern="grid",
    print_speed=60
)
time = estimate_build_time(100, 50*50, 60)
material = calculate_material_usage(100*100*100, 20, 10)
print(f"Estimated build time: {time:.1f} hours")
print(f"Material required: {material:.1f} g")
```

### CAM Post-Processing
```python
@dataclass
class PostProcessorConfig:
    machine_type: str
    control_system: str
    output_format: str
    arc_output: str
    tool_change_mcode: str
    coolant_mcodes: Tuple[str, str]

def generate_post_processor(
    config: PostProcessorConfig
) -> dict:
    """Generate post-processor configuration."""
    return {
        "header": [
            f"O1234 ({config.machine_type} program)",
            "G90 G21 G40",
            f"G54 (Work coordinate: {config.control_system})"
        ],
        "tool_change": f"M6 T#{{TOOL_NUMBER}} ({config.tool_change_mcode})",
        "coolant_on": config.coolant_mcodes[0],
        "coolant_off": config.coolant_mcodes[1],
        "arc_format": config.arc_output,
        "footer": ["M5", "M30"]
    }

def interpolate_gcode(
    input_points: List[Tuple[float, float, float]],
    tolerance: float = 0.01
) -> List[Tuple[float, float, float]]:
    """Interpolate toolpath with tolerance."""
    output = [input_points[0]]
    
    for i in range(1, len(input_points)):
        p1 = input_points[i-1]
        p2 = input_points[i]
        dist = math.sqrt(
            (p2[0]-p1[0])**2 + 
            (p2[1]-p1[1])**2 + 
            (p2[2]-p1[2])**2
        )
        num_points = max(2, int(dist / tolerance))
        
        for j in range(1, num_points):
            t = j / num_points
            output.append((
                p1[0] + (p2[0]-p1[0]) * t,
                p1[1] + (p2[1]-p1[1]) * t,
                p1[2] + (p2[2]-p1[2]) * t
            ))
    
    return output

def verify_toolpath(
    toolpath: List[Tuple[float, float, float]],
    machine_limits: dict
) -> List[str]:
    """Verify toolpath against machine limits."""
    warnings = []
    
    for i, (x, y, z) in enumerate(toolpath):
        if x < machine_limits["x_min"] or x > machine_limits["x_max"]:
            warnings.append(f"Point {i}: X={x:.3f} out of range")
        if y < machine_limits["y_min"] or y > machine_limits["y_max"]:
            warnings.append(f"Point {i}: Y={y:.3f} out of range")
        if z < machine_limits["z_min"] or z > machine_limits["z_max"]:
            warnings.append(f"Point {i}: Z={z:.3f} out of range")
    
    return warnings

# Example: Post-processor
config = PostProcessorConfig(
    machine_type="Haas VF-2",
    control_system="Fanuc",
    output_format="XYZ",
    arc_output="IJ",
    tool_change_mcode="M6",
    coolant_on="M8",
    coolant_off="M9"
)
post = generate_post_processor(config)
print("Header:", post["header"][1])
print("Footer:", post["footer"][1])
```

## Best Practices
- Always verify toolpaths before cutting using simulation
- Use proper work coordinate systems and origin points
- Consider tool deflection and vibration in feed/speed calculations
- Use appropriate stock allowances for finish passes
- Verify machine limits and tool lengths before running programs
- Optimize toolpaths for reduced cycle time
- Use proper fixturing to minimize vibration
- Consider tolerances and shrink factors in CAD models
- Document CAM settings and post-processor configuration
- Test programs with air cuts before production runs

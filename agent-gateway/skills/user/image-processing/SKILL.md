---
name: image-processing
description: Image processing and manipulation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: utilities
---
## What I do
- Resize and transform images
- Handle image formats
- Optimize image quality
- Generate thumbnails
- Extract image metadata
- Apply filters and effects
- Handle image uploads securely
- Serve optimized images

## When to use me
When implementing image processing or handling image uploads.

## Image Processing Basics
```python
from PIL import Image, ImageFilter, ImageEnhance
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List, Tuple
import io


@dataclass
class ImageDimensions:
    """Image dimensions."""
    width: int
    height: int
    
    @property
    def aspect_ratio(self) -> float:
        return self.width / self.height
    
    def resize(self, max_width: int, max_height: int) -> 'ImageDimensions':
        """Resize while maintaining aspect ratio."""
        ratio = min(max_width / self.width, max_height / self.height)
        return ImageDimensions(
            width=int(self.width * ratio),
            height=int(self.height * ratio)
        )


@dataclass
class ImageConfig:
    """Image processing configuration."""
    format: str = "JPEG"
    quality: int = 85
    optimize: bool = True
    preserve_metadata: bool = False


class ImageProcessor:
    """Image processing operations."""
    
    def __init__(self, config: ImageConfig = None):
        self.config = config or ImageConfig()
    
    def open(self, image_path: Path) -> Image:
        """Open an image file."""
        return Image.open(image_path)
    
    def resize(
        self,
        image: Image,
        width: int,
        height: int,
        maintain_aspect: bool = True
    ) -> Image:
        """Resize image."""
        if maintain_aspect:
            current_dims = ImageDimensions(image.width, image.height)
            new_dims = current_dims.resize(width, height)
            width, height = new_dims.width, new_dims.height
        
        return image.resize((width, height), Image.LANCZOS)
    
    def create_thumbnail(
        self,
        image: Image,
        max_size: Tuple[int, int] = (300, 300)
    ) -> Image:
        """Create thumbnail preserving aspect ratio."""
        image.thumbnail(max_size, Image.LANCZOS)
        return image
    
    def crop(
        self,
        image: Image,
        left: int,
        top: int,
        right: int,
        bottom: int
    ) -> Image:
        """Crop image."""
        return image.crop((left, top, right, bottom))
    
    def rotate(self, image: Image, degrees: float) -> Image:
        """Rotate image."""
        return image.rotate(-degrees, expand=True)
    
    def flip_horizontal(self, image: Image) -> Image:
        """Flip image horizontally."""
        return image.transpose(Image.FLIP_LEFT_RIGHT)
    
    def flip_vertical(self, image: Image) -> Image:
        """Flip image vertically."""
        return image.transpose(Image.FLIP_TOP_BOTTOM)


class ImageFilterApplier:
    """Apply filters to images."""
    
    @staticmethod
    def blur(image: Image, radius: float = 2) -> Image:
        """Apply Gaussian blur."""
        return image.filter(ImageFilter.GaussianBlur(radius))
    
    @staticmethod
    def sharpen(image: Image) -> Image:
        """Sharpen image."""
        return image.filter(ImageFilter.SHARPEN)
    
    @staticmethod
    def contour(image: Image) -> Image:
        """Apply contour filter."""
        return image.filter(ImageFilter.CONTOUR)
    
    @staticmethod
    def edge_enhance(image: Image) -> Image:
        """Edge enhancement."""
        return image.filter(ImageFilter.EDGE_ENHANCE)
    
    @staticmethod
    def emboss(image: Image) -> Image:
        """Apply emboss effect."""
        return image.filter(ImageFilter.EMBOSS)
    
    @staticmethod
    def adjust_brightness(image: Image, factor: float) -> Image:
        """Adjust brightness."""
        enhancer = ImageEnhance.Brightness(image)
        return enhancer.enhance(factor)
    
    @staticmethod
    def adjust_contrast(image: Image, factor: float) -> Image:
        """Adjust contrast."""
        enhancer = ImageEnhance.Contrast(image)
        return enhancer.enhance(factor)
    
    @staticmethod
    def adjust_saturation(image: Image, factor: float) -> Image:
        """Adjust saturation."""
        enhancer = ImageEnhance.Color(image)
        return enhancer.enhance(factor)


class ImageOptimizer:
    """Optimize images for web."""
    
    def __init__(self, config: ImageConfig = None):
        self.config = config or ImageConfig()
    
    def optimize(
        self,
        image: Image,
        output_format: str = None
    ) -> Image:
        """Optimize image."""
        format = output_format or self.config.format
        
        if format.upper() == "JPEG":
            image = image.convert("RGB")
        
        return image
    
    def save_with_quality(
        self,
        image: Image,
        output_path: Path,
        quality: int = None,
        format: str = None
    ) -> None:
        """Save image with specific quality."""
        quality = quality or self.config.quality
        format = format or self.config.format
        
        save_kwargs = {
            "quality": quality,
            "optimize": self.config.optimize,
        }
        
        if format.upper() == "JPEG":
            save_kwargs["subsampling"] = 0
        
        image.save(output_path, format=format, **save_kwargs)
    
    def save_to_bytes(
        self,
        image: Image,
        format: str = None,
        quality: int = None
    ) -> bytes:
        """Save image to bytes."""
        format = format or self.config.format
        quality = quality or self.config.quality
        
        buffer = io.BytesIO()
        
        save_kwargs = {
            "quality": quality,
            "optimize": self.config.optimize,
        }
        
        image.save(buffer, format=format, **save_kwargs)
        
        return buffer.getvalue()
    
    def create_responsive_set(
        self,
        image: Image,
        sizes: List[Tuple[int, str]],
        output_dir: Path,
        prefix: str = "image"
    ) -> List[dict]:
        """Create responsive image set."""
        results = []
        
        for width, suffix in sizes:
            new_height = int(image.height * (width / image.width))
            
            resized = self.resize(
                image,
                width,
                new_height,
                maintain_aspect=True
            )
            
            filename = f"{prefix}_{suffix}.jpg"
            output_path = output_dir / filename
            
            self.save_with_quality(resized, output_path)
            
            results.append({
                "filename": filename,
                "width": resized.width,
                "height": resized.height,
                "url": f"/images/{filename}"
            })
        
        return results
```

## Image Upload Handling
```python
from pathlib import Path
from typing import Optional
import magic
import hashlib


class SecureImageUploader:
    """Secure image upload handling."""
    
    ALLOWED_TYPES = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    
    def __init__(self, upload_dir: Path, processor: ImageProcessor):
        self.upload_dir = upload_dir
        self.processor = processor
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_upload(
        self,
        file_content: bytes,
        original_filename: str
    ) -> dict:
        """Save uploaded image securely."""
        # Validate file type
        mime_type = magic.from_buffer(file_content, mime=True)
        
        if mime_type not in self.ALLOWED_TYPES:
            raise InvalidImageError(
                f"Invalid file type: {mime_type}"
            )
        
        # Validate size
        if len(file_content) > self.MAX_SIZE:
            raise InvalidImageError(
                f"File too large: {len(file_content)} bytes"
            )
        
        # Generate safe filename
        ext = self.ALLOWED_TYPES[mime_type]
        safe_filename = self._generate_safe_filename(original_filename, ext)
        file_path = self.upload_dir / safe_filename
        
        # Save file
        file_path.write_bytes(file_content)
        
        # Process image
        image = self.processor.open(file_path)
        
        # Create thumbnail
        thumbnail = self.processor.create_thumbnail(image)
        thumbnail_path = self.upload_dir / f"thumb_{safe_filename}"
        self.processor.save_with_quality(thumbnail, thumbnail_path)
        
        return {
            "original": str(file_path),
            "thumbnail": str(thumbnail_path),
            "filename": safe_filename,
            "width": image.width,
            "height": image.height,
            "size": len(file_content),
            "type": mime_type,
        }
    
    def _generate_safe_filename(
        self,
        original_filename: str,
        extension: str
    ) -> str:
        """Generate safe, unique filename."""
        # Get base name
        stem = Path(original_filename).stem
        
        # Sanitize
        safe_stem = "".join(
            c for c in stem
            if c.isalnum() or c in "-_"
        )
        safe_stem = safe_stem[:50]  # Limit length
        
        # Add hash for uniqueness
        hash_suffix = hashlib.md5(
            f"{original_filename}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:8]
        
        return f"{safe_stem}_{hash_suffix}{extension}"
```

## Image Analysis
```python
from PIL import ImageDraw, ImageFont
from collections import Counter


class ImageAnalyzer:
    """Analyze image properties."""
    
    @staticmethod
    def get_dimensions(image: Image) -> Tuple[int, int]:
        """Get image dimensions."""
        return image.width, image.height
    
    @staticmethod
    def get_format(image: Image) -> str:
        """Get image format."""
        return image.format or "Unknown"
    
    @staticmethod
    def get_mode(image: Image) -> str:
        """Get image mode (RGB, L, etc.)."""
        return image.mode
    
    @staticmethod
    def get_info(image: Image) -> dict:
        """Get comprehensive image info."""
        return {
            "format": image.format,
            "mode": image.mode,
            "width": image.width,
            "height": image.height,
            "size_bytes": image.size[0] * image.size[1],
            "has_alpha": image.mode in ("RGBA", "LA", "P"),
            "aspect_ratio": image.width / image.height if image.height else 0,
        }
    
    @staticmethod
    def get_color_histogram(image: Image) -> dict:
        """Get color histogram."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        colors = list(image.getdata())
        color_counts = Counter(colors)
        
        return {
            "unique_colors": len(color_counts),
            "top_colors": color_counts.most_common(10),
        }
    
    @staticmethod
    def is_portrait(image: Image) -> bool:
        """Check if image is portrait orientation."""
        return image.height > image.width
    
    @staticmethod
    def is_landscape(image: Image) -> bool:
        """Check if image is landscape orientation."""
        return image.width > image.height
    
    @staticmethod
    def is_square(image: Image) -> bool:
        """Check if image is square."""
        return image.width == image.height
    
    @staticmethod
    def estimate_quality(image: Image) -> str:
        """Estimate image quality level."""
        width = image.width
        height = image.height
        
        if width < 300 or height < 300:
            return "low"
        elif width < 800 or height < 800:
            return "medium"
        elif width < 2000 or height < 2000:
            return "high"
        else:
            return "very_high"


# Watermark application
class WatermarkApplier:
    """Apply watermarks to images."""
    
    def __init__(self, text: str, font_size: int = 24):
        self.text = text
        self.font_size = font_size
    
    def add_text_watermark(
        self,
        image: Image,
        position: str = "bottom-right",
        opacity: float = 0.5
    ) -> Image:
        """Add text watermark."""
        if image.mode != "RGBA":
            image = image.convert("RGBA")
        
        watermark = Image.new("RGBA", image.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(watermark)
        
        # Calculate position
        width, height = image.size
        
        if position == "bottom-right":
            x = width - 200
            y = height - 50
        elif position == "bottom-left":
            x = 20
            y = height - 50
        elif position == "top-right":
            x = width - 200
            y = 20
        elif position == "top-left":
            x = 20
            y = 20
        else:  # center
            x = width // 2 - 50
            y = height // 2
        
        # Draw text with transparency
        draw.text(
            (x, y),
            self.text,
            fill=(255, 255, 255, int(255 * opacity))
        )
        
        # Composite
        watermarked = Image.alpha_composite(image, watermark)
        
        return watermarked.convert("RGB")
```

## Best Practices
```
Image Processing Best Practices:

1. Validate uploads
   Check file type
   Check file size

2. Generate unique names
   Prevent overwrites
   Use hashes

3. Create thumbnails
   For previews
   Reduce bandwidth

4. Use appropriate formats
   JPEG for photos
   PNG for graphics
   WebP for modern browsers

5. Optimize for web
   Compress images
   Right-size dimensions

6. Preserve aspect ratio
   Don't distort images
   Calculate dimensions

7. Handle metadata
   Strip sensitive EXIF
   Preserve copyright if needed

8. Serve efficiently
   CDN for delivery
   Responsive images

9. Process asynchronously
   Don't block requests
   Use queues

10. Clean up old files
    Define retention
    Delete unused images
```

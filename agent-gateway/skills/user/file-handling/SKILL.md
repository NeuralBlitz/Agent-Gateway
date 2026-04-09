---
name: file-handling
description: File handling and I/O best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: utilities
---
## What I do
- Handle file operations safely
- Process large files efficiently
- Handle file uploads and downloads
- Manage file permissions
- Process different file formats
- Handle encoding issues
- Implement streaming for large files
- Secure file operations

## When to use me
When implementing file handling, uploads, or processing.

## Safe File Operations
```python
import os
import tempfile
import shutil
from pathlib import Path
from typing import Optional, BinaryIO
import hashlib


class SafeFileHandler:
    """Safe file operations with validation."""
    
    ALLOWED_EXTENSIONS = {'.txt', '.csv', '.json', '.png', '.jpg', '.pdf'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    BLOCK_SIZE = 8192
    
    @staticmethod
    def validate_file_path(base_dir: Path, filename: str) -> Path:
        """
        Validate and sanitize file path.
        Prevents path traversal attacks.
        """
        filename = Path(filename).name  # Remove directories
        
        safe_path = (base_dir / filename).resolve()
        
        # Ensure path is within base directory
        if not str(safe_path).startswith(str(base_dir.resolve())):
            raise SecurityError("Invalid file path")
        
        return safe_path
    
    @staticmethod
    def validate_extension(filename: str) -> str:
        """Validate file extension."""
        ext = Path(filename).suffix.lower()
        
        if ext not in SafeFileHandler.ALLOWED_EXTENSIONS:
            raise ValidationError(
                f"File type not allowed. "
                f"Allowed: {SafeFileHandler.ALLOWED_EXTENSIONS}"
            )
        
        return ext
    
    @staticmethod
    def validate_size(size: int) -> None:
        """Validate file size."""
        if size > SafeFileHandler.MAX_FILE_SIZE:
            raise ValidationError(
                f"File too large. Max size: {SafeFileHandler.MAX_FILE_SIZE} bytes"
            )
    
    @staticmethod
    def calculate_checksum(file_path: Path) -> str:
        """Calculate MD5 checksum of file."""
        hash_md5 = hashlib.md5()
        
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(SafeFileHandler.BLOCK_SIZE), b""):
                hash_md5.update(chunk)
        
        return hash_md5.hexdigest()
```

## File Upload Handling
```python
import aiofiles
from fastapi import UploadFile, HTTPException
from starlette.datastructures import UploadFile as StarletteUploadFile
import tempfile
import os


class FileUploader:
    """Handle file uploads securely."""
    
    UPLOAD_DIR = Path("/uploads")
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    def __init__(self, upload_dir: Path = None) -> None:
        self.upload_dir = upload_dir or self.UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_upload(
        self,
        file: UploadFile,
        user_id: str,
        max_size: int = None
    ) -> str:
        """
        Save uploaded file to disk.
        
        Returns:
            File path relative to upload directory
        """
        max_size = max_size or self.MAX_FILE_SIZE
        
        # Validate size
        file_size = 0
        content = b""
        
        async for chunk in file:
            file_size += len(chunk)
            if file_size > max_size:
                raise HTTPException(
                    status_code=413,
                    detail="File too large"
                )
            content += chunk
        
        # Generate safe filename
        file_ext = self._get_extension(file.filename)
        safe_filename = self._generate_safe_filename(user_id, file_ext)
        file_path = self.upload_dir / safe_filename
        
        # Write to disk
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        return str(file_path.relative_to(self.upload_dir))
    
    def _get_extension(self, filename: Optional[str]) -> str:
        """Get file extension."""
        if not filename:
            return ""
        return Path(filename).suffix.lower()
    
    def _generate_safe_filename(self, user_id: str, ext: str) -> str:
        """Generate unique, safe filename."""
        import uuid
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        unique_id = str(uuid.uuid4())[:8]
        return f"{user_id}_{timestamp}_{unique_id}{ext}"
    
    async def delete_file(self, file_path: str) -> None:
        """Delete uploaded file."""
        full_path = self.upload_dir / file_path
        
        if full_path.exists():
            full_path.unlink()
    
    async def cleanup_user_uploads(self, user_id: str) -> None:
        """Clean up all uploads for a user."""
        import glob
        
        pattern = str(self.upload_dir / f"{user_id}_*")
        for file_path in glob.glob(pattern):
            os.remove(file_path)
```

## Streaming Large Files
```python
import asyncio
from typing import AsyncIterator


class FileStreamer:
    """Stream large files efficiently."""
    
    CHUNK_SIZE = 64 * 1024  # 64KB chunks
    
    @staticmethod
    async def stream_file(
        file_path: Path,
        chunk_size: int = None
    ) -> AsyncIterator[bytes]:
        """
        Stream file in chunks.
        Memory efficient for large files.
        """
        chunk_size = chunk_size or FileStreamer.CHUNK_SIZE
        
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk
    
    @staticmethod
    async def stream_to_response(
        file_path: Path,
        response,
        content_type: str = "application/octet-stream"
    ) -> None:
        """Stream file to HTTP response."""
        response.headers["Content-Disposition"] = (
            f"attachment; filename={file_path.name}"
        )
        response.headers["Content-Type"] = content_type
        
        async for chunk in FileStreamer.stream_file(file_path):
            await response.write(chunk)
    
    @staticmethod
    async def process_large_csv(
        input_path: Path,
        output_path: Path,
        processor: callable
    ) -> None:
        """
        Process large CSV without loading into memory.
        """
        import csv
        
        with open(input_path, 'r', newline='', encoding='utf-8') as infile, \
             open(output_path, 'w', newline='', encoding='utf-8') as outfile:
            
            reader = csv.DictReader(infile)
            writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
            
            writer.writeheader()
            
            for row in reader:
                processed_row = processor(row)
                if processed_row:
                    writer.writerow(processed_row)
```

## File Format Processing
```python
import json
import csv
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Dict, Any


class FileParser(ABC):
    """Base class for file parsers."""
    
    @abstractmethod
    def parse(self, file_path: Path) -> List[Dict[str, Any]]:
        """Parse file and return data."""
        pass
    
    @abstractmethod
    def serialize(self, data: List[Dict[str, Any]], file_path: Path) -> None:
        """Serialize data to file."""
        pass


class JSONParser(FileParser):
    """Parse JSON files."""
    
    def parse(self, file_path: Path) -> List[Dict[str, Any]]:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data if isinstance(data, list) else [data]
    
    def serialize(
        self,
        data: List[Dict[str, Any]],
        file_path: Path
    ) -> None:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


class CSVParser(FileParser):
    """Parse CSV files."""
    
    def __init__(self, delimiter: str = ',') -> None:
        self.delimiter = delimiter
    
    def parse(self, file_path: Path) -> List[Dict[str, Any]]:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=self.delimiter)
            return list(reader)
    
    def serialize(
        self,
        data: List[Dict[str, Any]],
        file_path: Path
    ) -> None:
        if not data:
            return
        
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            fieldnames = data[0].keys()
            writer = csv.DictWriter(
                f,
                fieldnames=fieldnames,
                delimiter=self.delimiter
            )
            writer.writeheader()
            writer.writerows(data)


class XMLParser(FileParser):
    """Parse XML files."""
    
    def __init__(self, root_element: str, record_element: str) -> None:
        self.root_element = root_element
        self.record_element = record_element
    
    def parse(self, file_path: Path) -> List[Dict[str, Any]]:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        results = []
        for record in root.findall(self.record_element):
            results.append(self._element_to_dict(record))
        
        return results
    
    def _element_to_dict(self, element: ET.Element) -> Dict[str, Any]:
        """Convert XML element to dictionary."""
        result = {}
        
        for child in element:
            result[child.tag] = child.text or ""
        
        return result
    
    def serialize(
        self,
        data: List[Dict[str, Any]],
        file_path: Path
    ) -> None:
        root = ET.Element(self.root_element)
        
        for record in data:
            record_elem = ET.SubElement(root, self.record_element)
            for key, value in record.items():
                child = ET.SubElement(record_elem, key)
                child.text = str(value)
        
        tree = ET.ElementTree(root)
        tree.write(file_path, encoding='utf-8', xml_declaration=True)


# Factory for parsers
class ParserFactory:
    """Factory for creating file parsers."""
    
    PARSERS = {
        '.json': JSONParser,
        '.csv': CSVParser,
        '.xml': XMLParser,
    }
    
    @classmethod
    def get_parser(cls, file_path: Path) -> FileParser:
        """Get appropriate parser for file extension."""
        ext = file_path.suffix.lower()
        
        parser_class = cls.PARSERS.get(ext)
        if not parser_class:
            raise ValueError(f"No parser for extension: {ext}")
        
        return parser_class()
    
    @classmethod
    def parse_file(cls, file_path: Path) -> List[Dict[str, Any]]:
        """Parse file using appropriate parser."""
        parser = cls.get_parser(file_path)
        return parser.parse(file_path)
```

## Best Practices
```
1. Use context managers
   with open() as f:
       # File automatically closed

2. Handle encoding explicitly
   open(path, 'r', encoding='utf-8')

3. Use streaming for large files
   Don't load into memory

4. Validate file types
   Check magic numbers, not just extensions

5. Use secure paths
   Prevent path traversal

6. Set proper permissions
   chmod 644 for files, 755 for scripts

7. Handle I/O errors
   Try-except around file operations

8. Use temporary files
   For processing sensitive data

9. Clean up resources
   Delete temp files, close handles

10. Use async I/O
    For high-concurrency servers
```

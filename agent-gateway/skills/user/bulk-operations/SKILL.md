---
name: bulk-operations
description: Bulk data processing and operations
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: utilities
---
## What I do
- Implement bulk database operations
- Process large datasets efficiently
- Handle batch processing
- Implement progress tracking
- Handle errors in bulk operations
- Optimize bulk imports/exports
- Manage memory for large files
- Implement parallel processing

## When to use me
When implementing bulk data operations or processing large datasets.

## Bulk Database Operations
```python
from typing import List, Dict, Any, Callable
from dataclasses import dataclass
from contextlib import contextmanager
import itertools


@dataclass
class BulkOperationResult:
    """Result of bulk operation."""
    total: int
    successful: int
    failed: int
    errors: List[Dict[str, Any]]
    duration_seconds: float


class BulkDatabaseOperations:
    """Bulk database operations manager."""
    
    def __init__(self, db_session):
        self.session = db_session
    
    @contextmanager
    def bulk_insert(
        self,
        batch_size: int = 1000
    ):
        """Context manager for bulk inserts."""
        objects = []
        
        try:
            yield objects
        finally:
            if objects:
                self._flush_insert(objects)
                objects.clear()
    
    def _flush_insert(self, objects: List[Any]) -> int:
        """Flush pending inserts to database."""
        self.session.add_all(objects)
        self.session.commit()
        return len(objects)
    
    def bulk_insert_records(
        self,
        model_class,
        records: List[Dict[str, Any]]
    ) -> BulkOperationResult:
        """Bulk insert records efficiently."""
        start_time = datetime.utcnow()
        successful = 0
        failed = 0
        errors = []
        
        # Process in batches
        batch_size = 1000
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            try:
                self.session.bulk_insert_mappings(
                    model_class,
                    batch
                )
                self.session.commit()
                successful += len(batch)
            except Exception as e:
                # Rollback and retry individually
                self.session.rollback()
                
                for record in batch:
                    try:
                        obj = model_class(**record)
                        self.session.add(obj)
                        self.session.commit()
                        successful += 1
                    except Exception as record_error:
                        failed += 1
                        errors.append({
                            "record": record,
                            "error": str(record_error)
                        })
        
        return BulkOperationResult(
            total=len(records),
            successful=successful,
            failed=failed,
            errors=errors,
            duration_seconds=(datetime.utcnow() - start_time).total_seconds()
        )
    
    def bulk_update(
        self,
        model_class,
        updates: List[Dict[str, Any]],
        match_field: str = "id"
    ) -> BulkOperationResult:
        """Bulk update records efficiently."""
        start_time = datetime.utcnow()
        successful = 0
        failed = 0
        errors = []
        
        for update in updates:
            try:
                match_value = update.pop(match_field)
                
                self.session.query(model_class).filter(
                    getattr(model_class, match_field) == match_value
                ).update(update, synchronize_session=False)
                
                successful += 1
            except Exception as e:
                failed += 1
                errors.append({
                    "update": update,
                    "error": str(e)
                })
        
        self.session.commit()
        
        return BulkOperationResult(
            total=len(updates),
            successful=successful,
            failed=failed,
            errors=errors,
            duration_seconds=(datetime.utcnow() - start_time).total_seconds()
        )
    
    def bulk_upsert(
        self,
        model_class,
        records: List[Dict[str, Any]],
        unique_fields: List[str]
    ) -> BulkOperationResult:
        """Bulk upsert (insert or update) records."""
        start_time = datetime.utcnow()
        successful = 0
        failed = 0
        errors = []
        
        for record in records:
            try:
                # Build lookup query
                filters = {
                    field: record.get(field)
                    for field in unique_fields
                }
                
                existing = self.session.query(model_class).filter_by(**filters).first()
                
                if existing:
                    # Update
                    for key, value in record.items():
                        setattr(existing, key, value)
                else:
                    # Insert
                    obj = model_class(**record)
                    self.session.add(obj)
                
                successful += 1
            except Exception as e:
                failed += 1
                errors.append({
                    "record": record,
                    "error": str(e)
                })
        
        self.session.commit()
        
        return BulkOperationResult(
            total=len(records),
            successful=successful,
            failed=failed,
            errors=errors,
            duration_seconds=(datetime.utcnow() - start_time).total_seconds()
        )
```

## Chunked Processing
```python
from typing import Iterator, Callable, List
from dataclasses import dataclass
import asyncio


@dataclass
class ProcessingProgress:
    """Progress of chunked processing."""
    total_items: int
    processed_items: int
    failed_items: int
    current_chunk: int
    total_chunks: int
    percent_complete: float
    elapsed_seconds: float
    estimated_remaining_seconds: float
    
    def to_dict(self) -> dict:
        return {
            "total": self.total_items,
            "processed": self.processed_items,
            "failed": self.failed_items,
            "percent": self.percent_complete,
            "elapsed": f"{self.elapsed_seconds:.2f}s",
            "remaining": f"{self.estimated_remaining_seconds:.2f}s",
        }


class ChunkedProcessor:
    """Process data in chunks with progress tracking."""
    
    def __init__(
        self,
        chunk_size: int = 1000,
        progress_callback: Callable[[ProcessingProgress], None] = None
    ):
        self.chunk_size = chunk_size
        self.progress_callback = progress_callback
        self.start_time = None
    
    def process_in_chunks(
        self,
        items: List[Any],
        process_func: Callable[[List[Any]], List[Any]],
        max_chunks: int = None
    ) -> tuple[List[Any], ProcessingProgress]:
        """Process items in chunks."""
        self.start_time = datetime.utcnow()
        
        total_items = len(items)
        total_chunks = (total_items + self.chunk_size - 1) // self.chunk_size
        
        if max_chunks:
            total_chunks = min(total_chunks, max_chunks)
        
        processed_items = 0
        failed_items = 0
        all_results = []
        
        for chunk_idx in range(total_chunks):
            start_idx = chunk_idx * self.chunk_size
            end_idx = min(start_idx + self.chunk_size, total_items)
            chunk = items[start_idx:end_idx]
            
            try:
                results = process_func(chunk)
                all_results.extend(results)
                processed_items += len(results)
            except Exception as e:
                failed_items += len(chunk)
                # Log error but continue
                print(f"Error processing chunk {chunk_idx}: {e}")
            
            # Report progress
            progress = self._calculate_progress(
                total_items,
                processed_items,
                failed_items,
                chunk_idx + 1,
                total_chunks
            )
            
            if self.progress_callback:
                self.progress_callback(progress)
        
        return all_results, progress
    
    def _calculate_progress(
        self,
        total_items: int,
        processed_items: int,
        failed_items: int,
        current_chunk: int,
        total_chunks: int
    ) -> ProcessingProgress:
        """Calculate current progress."""
        elapsed = (datetime.utcnow() - self.start_time).total_seconds()
        
        items_processed = processed_items + failed_items
        percent_complete = (items_processed / total_items * 100) if total_items else 0
        
        if elapsed > 0 and processed_items > 0:
            items_per_second = processed_items / elapsed
            remaining_items = total_items - items_processed
            estimated_remaining = remaining_items / items_per_second
        else:
            estimated_remaining = 0
        
        return ProcessingProgress(
            total_items=total_items,
            processed_items=processed_items,
            failed_items=failed_items,
            current_chunk=current_chunk,
            total_chunks=total_chunks,
            percent_complete=percent_complete,
            elapsed_seconds=elapsed,
            estimated_remaining_seconds=estimated_remaining
        )


# Streaming iterator for large files
def stream_large_file(
    file_path: str,
    chunk_size: int = 10000,
    parse_func: Callable[[str], Dict] = None
) -> Iterator[List[Dict]]:
    """Stream large file in chunks."""
    parse_func = parse_func or json.loads
    
    with open(file_path, 'r', encoding='utf-8') as f:
        chunk = []
        
        for line in f:
            parsed = parse_func(line.strip())
            chunk.append(parsed)
            
            if len(chunk) >= chunk_size:
                yield chunk
                chunk = []
        
        # Yield remaining items
        if chunk:
            yield chunk
```

## Parallel Processing
```python
import multiprocessing
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from typing import List, Callable


class ParallelProcessor:
    """Parallel processing with configurable workers."""
    
    def __init__(
        self,
        max_workers: int = None,
        use_processes: bool = False
    ):
        self.max_workers = max_workers or multiprocessing.cpu_count()
        self.use_processes = use_processes
    
    def execute(
        self,
        func: Callable,
        items: List[Any],
        progress_callback: Callable[[int, int], None] = None
    ) -> List[Any]:
        """Execute function on items in parallel."""
        ExecutorClass = (
            ProcessPoolExecutor
            if self.use_processes
            else ThreadPoolExecutor
        )
        
        with ExecutorClass(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(func, item): item
                for item in items
            }
            
            results = []
            for i, future in enumerate(
                as_completed(futures.keys()),
                1
            ):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    item = futures[future]
                    print(f"Error processing {item}: {e}")
                
                if progress_callback:
                    progress_callback(i, len(items))
            
            return results
    
    def map_chunks(
        self,
        func: Callable,
        chunks: List[List[Any]],
        progress_callback: Callable[[int, int], None] = None
    ) -> List[Any]:
        """Process chunks in parallel."""
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(func, chunk): idx
                for idx, chunk in enumerate(chunks)
            }
            
            results = [None] * len(chunks)
            
            for future in as_completed(futures.keys()):
                idx = futures[future]
                try:
                    results[idx] = future.result()
                except Exception as e:
                    print(f"Error processing chunk {idx}: {e}")
                    results[idx] = None
                
                if progress_callback:
                    progress_callback(idx + 1, len(chunks))
            
            return results
```

## Batch Processing Queue
```python
from dataclasses import dataclass
from typing import Callable, Any
from datetime import datetime
import json


@dataclass
class BatchJob:
    """Batch job configuration."""
    job_id: str
    job_type: str
    payload: dict
    status: str = "pending"
    created_at: datetime = None
    started_at: datetime = None
    completed_at: datetime = None
    result: Any = None
    error: str = None
    retry_count: int = 0
    max_retries: int = 3


class BatchJobProcessor:
    """Process batch jobs from queue."""
    
    def __init__(self, queue, storage, max_concurrent: int = 5):
        self.queue = queue
        self.storage = storage
        self.max_concurrent = max_concurrent
        self.active_jobs = set()
    
    async def process_queue(self) -> None:
        """Process jobs from queue."""
        while True:
            # Get next job
            job_data = await self.queue.get()
            
            if job_data is None:
                break
            
            job = BatchJob(**job_data)
            
            # Check concurrent limit
            while len(self.active_jobs) >= self.max_concurrent:
                await asyncio.sleep(1)
            
            # Process job
            self.active_jobs.add(job.job_id)
            
            try:
                result = await self._execute_job(job)
                
                job.status = "completed"
                job.result = result
                job.completed_at = datetime.utcnow()
                
                await self.storage.save_job(job)
                
            except Exception as e:
                job.retry_count += 1
                
                if job.retry_count >= job.max_retries:
                    job.status = "failed"
                    job.error = str(e)
                    job.completed_at = datetime.utcnow()
                else:
                    # Requeue with backoff
                    job.status = "pending"
                    await self.queue.put(job.to_dict())
                
                await self.storage.save_job(job)
            
            finally:
                self.active_jobs.discard(job.job_id)
    
    async def _execute_job(self, job: BatchJob) -> Any:
        """Execute a single job."""
        job_handlers = {
            "import": self._handle_import,
            "export": self._handle_export,
            "process": self._handle_process,
        }
        
        handler = job_handlers.get(job.job_type)
        
        if not handler:
            raise ValueError(f"Unknown job type: {job.job_type}")
        
        return await handler(job.payload)
    
    async def _handle_import(self, payload: dict) -> dict:
        """Handle import job."""
        # Import logic
        return {"imported": 100}
    
    async def _handle_export(self, payload: dict) -> dict:
        """Handle export job."""
        # Export logic
        return {"exported": 100}
    
    async def _handle_process(self, payload: dict) -> dict:
        """Handle processing job."""
        # Processing logic
        return {"processed": 100}
```

## Best Practices
```
Bulk Operations Best Practices:

1. Use batch operations
   Bulk inserts instead of individual
   Reduces round trips

2. Process in chunks
   Memory efficient
   Progress tracking

3. Handle errors gracefully
   Skip failed items
   Log for review

4. Monitor progress
   Real-time updates
   ETA calculations

5. Use transactions appropriately
   Commit frequently
   Balance performance

6. Parallelize I/O bound
   Thread pool for I/O
   Process pool for CPU

7. Queue for reliability
   Persistent queue
   Retry with backoff

8. Validate input
   Check before processing
   Sanitize data

9. Resource limits
   Memory constraints
   Timeout handling

10. Clean up after
     Temporary files
     Progress markers
```

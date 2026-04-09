---
name: Offline-First
description: Mobile architecture designed for offline functionality
license: MIT
compatibility: iOS, Android, Cross-platform
audience: Mobile architects and developers
category: Mobile Development
---

# Offline-First Development

## What I Do

I provide guidance for designing mobile applications that work seamlessly offline. I cover local data storage, sync strategies, conflict resolution, and background synchronization patterns.

## When to Use Me

- Building apps with unreliable network access
- Implementing local-first data architectures
- Designing sync mechanisms for mobile apps
- Handling conflict resolution for shared data
- Optimizing for battery and bandwidth constraints

## Core Concepts

- **Local-First Architecture**: Prioritize local data storage
- **Sync Queue**: Pending changes queued for synchronization
- **Conflict Resolution**: Strategies for merging concurrent edits
- **Change Tracking**: Recording modifications for sync
- **Background Sync**: Syncing when app is not active
- **Data Encryption**: Protecting local sensitive data
- **Storage Encryption**: Secure local storage implementation
- **Network Detection**: Monitoring connectivity state
- **Optimistic Updates**: UI updates before server confirmation
- **Conflict-Free Replicated Data Types (CRDTs)**: Merge strategies

## Code Examples

### Local Database with Sync Queue

```dart
import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class LocalDatabase {
  static final LocalDatabase _instance = LocalDatabase._();
  factory LocalDatabase() => _instance;
  LocalDatabase._();
  
  Database? _database;
  
  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }
  
  Future<Database> _initDatabase() async {
    return openDatabase(
      join(await getDatabasesPath(), 'app_database.db'),
      version: 1,
      onCreate: _onCreate,
    );
  }
  
  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        updated_at INTEGER,
        sync_status TEXT DEFAULT 'pending',
        local_marks_for_deletion INTEGER DEFAULT 0
      )
    ''');
    
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT,
        entity_id TEXT,
        operation TEXT,
        payload TEXT,
        created_at INTEGER,
        retry_count INTEGER DEFAULT 0
      )
    ''');
    
    await db.execute('''
      CREATE INDEX idx_sync_queue_pending ON sync_queue(
        retry_count, created_at
      )
    ''');
  }
  
  Future<void> insertUser(User user, {bool queueForSync = true}) async {
    final db = await database;
    
    await db.insert('users', {
      'id': user.id,
      'name': user.name,
      'email': user.email,
      'updated_at': DateTime.now().millisecondsSinceEpoch,
      'sync_status': queueForSync ? 'pending' : 'synced',
    });
    
    if (queueForSync) {
      await queueOperation('INSERT', 'users', user.toMap());
    }
  }
  
  Future<void> updateUser(User user) async {
    final db = await database;
    
    await db.update(
      'users',
      {
        'name': user.name,
        'email': user.email,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
        'sync_status': 'pending',
      },
      where: 'id = ?',
      whereArgs: [user.id],
    );
    
    await queueOperation('UPDATE', 'users', user.toMap());
  }
  
  Future<void> deleteUser(String userId) async {
    final db = await database;
    
    await db.update(
      'users',
      {
        'sync_status': 'pending',
        'local_marks_for_deletion': 1,
      },
      where: 'id = ?',
      whereArgs: [userId],
    );
    
    await queueOperation('DELETE', 'users', {'id': userId});
  }
  
  Future<void> queueOperation(
    String operation,
    String entityType,
    Map<String, dynamic> payload,
  ) async {
    final db = await database;
    
    await db.insert('sync_queue', {
      'entity_type': entityType,
      'entity_id': payload['id'] ?? '',
      'operation': operation,
      'payload': payload.toString(),
      'created_at': DateTime.now().millisecondsSinceEpoch,
      'retry_count': 0,
    });
  }
  
  Future<List<Map<String, dynamic>>> getPendingSyncItems() async {
    final db = await database;
    
    return db.query(
      'sync_queue',
      where: 'retry_count < ?',
      whereArgs: [3],
      orderBy: 'created_at ASC',
    );
  }
}
```

### Network-Aware Sync Manager

```kotlin
class SyncManager(
    private val localDb: LocalDatabase,
    private val api: RemoteApi,
    private val connectivityManager: ConnectivityManager
) {
    private val _syncState = MutableStateFlow(SyncState.IDLE)
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()
    
    private var syncJob: Job? = null
    
    init {
        observeNetworkChanges()
        schedulePeriodicSync()
    }
    
    private fun observeNetworkChanges() {
        connectivityManager.registerDefaultNetworkCallback(
            object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    if (_syncState.value == SyncState.PENDING) {
                        syncPendingChanges()
                    }
                }
                
                override fun onLost(network: Network) {
                    _syncState.value = SyncState.OFFLINE
                }
            }
        )
    }
    
    fun syncPendingChanges() {
        if (!connectivityManager.hasActiveNetwork()) {
            _syncState.value = SyncState.PENDING
            return
        }
        
        syncJob?.cancel()
        syncJob = CoroutineScope(Dispatchers.IO).launch {
            _syncState.value = SyncState.SYNCING
            
            try {
                val pendingItems = localDb.getPendingSyncItems()
                
                for (item in pendingItems) {
                    val result = syncItem(item)
                    if (result.isSuccess) {
                        localDb.removeSyncItem(item.id)
                    } else {
                        localDb.incrementRetryCount(item.id)
                    }
                }
                
                val serverChanges = api.fetchChanges(lastSyncTime)
                localDb.mergeServerChanges(serverChanges)
                
                lastSyncTime = System.currentTimeMillis()
                _syncState.value = SyncState.SYNCED
            } catch (e: Exception) {
                _syncState.value = SyncState.ERROR
                logError("Sync failed", e)
            }
        }
    }
    
    private suspend fun syncItem(syncItem: SyncQueueItem): Result<Unit> {
        return try {
            when (syncItem.operation) {
                "INSERT" -> api.createResource(
                    syncItem.entityType,
                    parsePayload(syncItem.payload)
                )
                "UPDATE" -> api.updateResource(
                    syncItem.entityType,
                    syncItem.entityId,
                    parsePayload(syncItem.payload)
                )
                "DELETE" -> api.deleteResource(
                    syncItem.entityType,
                    syncItem.entityId
                )
                else -> Result.failure(IllegalArgumentException("Unknown operation"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun schedulePeriodicSync() {
        val workRequest = PeriodicWorkRequestBuilder<SyncWorker>(
            repeatInterval = 15,
            repeatIntervalTimeUnit = TimeUnit.MINUTES
        ).setConstraints(
            Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
        ).build()
        
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                "sync_work",
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            )
    }
}

enum class SyncState {
    IDLE,
    SYNCING,
    SYNCED,
    PENDING,
    ERROR,
    OFFLINE
}
```

### Conflict Resolution with Timestamps

```swift
struct ConflictResolution {
    
    static func resolve<T: Identifiable & Timestampable>(
        local: T,
        server: T,
        strategy: ConflictStrategy = .lastWriteWins
    ) -> T {
        switch strategy {
        case .lastWriteWins:
            return local.updatedAt > server.updatedAt ? local : server
        case .serverWins:
            return server
        case .mergeFields(let fieldPriority):
            return mergeFields(local: local, server: server, priority: fieldPriority)
        case .askUser:
            return local
        }
    }
    
    private static func mergeFields<T: Identifiable & Timestampable>(
        local: T,
        server: T,
        priority: [String: ConflictStrategy]
    ) -> T {
        var merged = server
        
        let mirror = Mirror(reflecting: local)
        
        for case let (label?, value) in mirror.children {
            guard let serverValue = mirror.children
                .first(where: { $0.label == label })?.value
            else { continue }
            
            let localTime = extractTimestamp(from: value)
            let serverTime = extractTimestamp(from: serverValue)
            
            if let localTime = localTime, let serverTime = serverTime {
                if localTime > serverTime {
                    setValue(value, for: label, on: &merged)
                }
            }
        }
        
        return merged
    }
}

enum ConflictStrategy {
    case lastWriteWins
    case serverWins
    case mergeFields(priority: [String: ConflictStrategy])
    case askUser
}
```

## Best Practices

1. **Design for Offline First**: Assume network is unavailable
2. **Use ACID Transactions**: Ensure data consistency locally
3. **Implement Exponential Backoff**: Retry failed syncs with delays
4. **Encrypt Sensitive Data**: Use secure storage for tokens and PII
5. **Handle Conflict Resolution Early**: Define strategies before building
6. **Use Version Vectors**: Track causal relationships between changes
7. **Implement Graceful Degradation**: Show cached content when offline
8. **Track Sync State**: Provide visual feedback on sync status
9. **Limit Local Storage**: Set quotas to prevent disk exhaustion
10. **Test Offline Scenarios**: Verify behavior without network

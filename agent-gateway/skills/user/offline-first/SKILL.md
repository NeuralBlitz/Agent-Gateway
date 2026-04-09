---
name: offline-first
description: Mobile architecture designed for offline functionality
category: mobile-development
difficulty: advanced
tags: [mobile, offline, sync, local-storage]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Offline-First Architecture

## What I Do

I am Offline-First Architecture, a design approach that prioritizes application functionality regardless of network connectivity. I assume network availability is the exception rather than the norm, designing applications to work seamlessly offline with data stored locally. I synchronize local changes with remote servers when connectivity is restored using conflict resolution strategies. I implement various storage mechanisms including SQLite, Realm, IndexedDB, and file systems. I handle background sync, push notifications for sync completion, and merge strategies for concurrent edits. I optimize for low-bandwidth scenarios, progressive data loading, and graceful degradation. I enable users to be productive during network outages while ensuring data consistency upon reconnection.

## When to Use Me

- Mobile applications with unreliable connectivity
- Field service and enterprise mobile apps
- Productivity applications requiring data access anywhere
- IoT and embedded device applications
- Applications with heavy data consumption patterns
- User-facing scenarios with variable network conditions
- Applications requiring immediate responsiveness
- Compliance scenarios requiring local data audit trails

## Core Concepts

**Local Storage**: Primary data store that persists data locally on the device.

**Sync Queue**: FIFO queue managing pending changes awaiting synchronization.

**Conflict Resolution**: Strategies for merging concurrent local and remote edits.

**Background Sync**: Automatic synchronization when app is not active.

**Data Versioning**: Tracking data states with timestamps or version numbers.

**Optimistic UI**: Immediate user feedback assuming successful operations.

**Delta Sync**: Transferring only changed data rather than full datasets.

**Connectivity Awareness**: Real-time detection of network state changes.

## Code Examples

### Example 1: Offline Data Store with Conflict Resolution
```typescript
// offline-store.ts
abstract class OfflineStore<T> {
  protected abstract createLocalStorage(): LocalStorage
  protected abstract createSyncQueue(): SyncQueue
  protected abstract createConflictResolver(): ConflictResolver<T>
  
  async save(entity: T): Promise<void> {
    const localStorage = this.createLocalStorage()
    const syncQueue = this.createSyncQueue()
    
    // Optimistically save to local storage
    await localStorage.save(entity)
    
    // Queue for sync
    await syncQueue.enqueue({
      type: 'UPSERT',
      entity,
      timestamp: Date.now(),
      version: entity.version || 0
    })
  }
  
  async delete(id: string): Promise<void> {
    const localStorage = this.createLocalStorage()
    const syncQueue = this.createSyncQueue()
    
    await localStorage.delete(id)
    
    await syncQueue.enqueue({
      type: 'DELETE',
      entityId: id,
      timestamp: Date.now()
    })
  }
  
  async get(id: string): Promise<T | null> {
    const localStorage = this.createLocalStorage()
    return localStorage.get(id)
  }
  
  async getAll(): Promise<T[]> {
    const localStorage = this.createLocalStorage()
    return localStorage.getAll()
  }
  
  async sync(): Promise<SyncResult> {
    const localStorage = this.createLocalStorage()
    const syncQueue = this.createSyncQueue()
    const conflictResolver = this.createConflictResolver()
    
    const pendingChanges = await syncQueue.getPending()
    const syncResult: SyncResult = { success: 0, failed: 0, conflicts: [] }
    
    for (const change of pendingChanges) {
      try {
        const remoteEntity = await this.fetchRemote(change.entityId)
        
        if (remoteEntity && change.type === 'UPSERT') {
          const conflict = await conflictResolver.resolve(
            change.entity,
            remoteEntity
          )
          
          if (conflict.resolution === 'MERGE') {
            const mergedEntity = conflict.merged!
            await this.updateRemote(mergedEntity)
            await localStorage.save(mergedEntity)
          } else if (conflict.resolution === 'REMOTE') {
            await localStorage.save(remoteEntity)
            await syncQueue.remove(change.id)
          }
          syncResult.conflicts.push(conflict)
        } else {
          await this.updateRemote(change.entity)
          await syncQueue.remove(change.id)
        }
        syncResult.success++
      } catch (error) {
        syncResult.failed++
        await syncQueue.markFailed(change.id, error)
      }
    }
    
    return syncResult
  }
  
  protected abstract fetchRemote(id: string): Promise<T | null>
  protected abstract updateRemote(entity: T): Promise<void>
}

interface SyncQueueItem {
  id: string
  type: 'UPSERT' | 'DELETE'
  entity?: T
  entityId?: string
  timestamp: number
  version: number
  retryCount: number
  status: 'pending' | 'synced' | 'failed'
}

interface SyncResult {
  success: number
  failed: number
  conflicts: Conflict<T>[]
}

interface Conflict<T> {
  local: T
  remote: T
  resolution: 'LOCAL' | 'REMOTE' | 'MERGE'
  merged?: T
}
```

### Example 2: SQLite Database with React Native
```typescript
// database.ts
import SQLite from 'react-native-sqlite-storage'

const DATABASE_NAME = 'offline_app.db'

interface Database {
  open(): Promise<void>
  close(): Promise<void>
  execute(sql: string, params?: any[]): Promise<any>
  transaction(fn: (tx: Transaction) => Promise<void>): Promise<void>
}

interface Transaction {
  executeSql(sql: string, params?: any[]): Promise<{ rows: any[], insertId: number }>
}

class SQLiteDatabase implements Database {
  private db: SQLite.SQLiteDatabase | null = null
  
  async open(): Promise<void> {
    this.db = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
      createFromLocation: '~www/database.db',
    })
    await this.createTables()
  }
  
  private async createTables(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        sync_status TEXT DEFAULT 'pending',
        is_deleted INTEGER DEFAULT 0
      )
    `)
    
    await this.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        version INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        sync_status TEXT DEFAULT 'pending',
        is_deleted INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
    
    await this.execute(`
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)
    `)
  }
  
  async execute(sql: string, params?: any[]): Promise<any> {
    if (!this.db) throw new Error('Database not opened')
    return new Promise((resolve, reject) => {
      this.db!.executeSql(sql, params).then(([results]) => {
        resolve({ rows: results.rows, insertId: results.insertId })
      }).catch(reject)
    })
  }
  
  async transaction(fn: (tx: Transaction) => Promise<void>): Promise<void> {
    if (!this.db) throw new Error('Database not opened')
    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        fn({
          executeSql: (sql, params) => {
            return new Promise((resolve, reject) => {
              tx.executeSql(sql, params, (_, results) => {
                resolve({ rows: results.rows, insertId: results.insertId })
              }).catch(reject)
            })
          }
        })
      }).then(resolve).catch(reject)
    })
  }
  
  async close(): Promise<void> {
    if (this.db) {
      await SQLite.closeDatabase(this.db)
      this.db = null
    }
  }
}

// Repository implementation
class UserRepository {
  private db: SQLiteDatabase
  
  constructor(db: SQLiteDatabase) {
    this.db = db
  }
  
  async create(user: User): Promise<void> {
    await this.db.execute(
      `INSERT INTO users (id, name, email, version, sync_status)
       VALUES (?, ?, ?, 1, 'pending')`,
      [user.id, user.name, user.email]
    )
  }
  
  async update(user: User): Promise<void> {
    await this.db.execute(
      `UPDATE users SET
         name = ?, email = ?, version = version + 1,
         updated_at = unixepoch(), sync_status = 'pending'
       WHERE id = ?`,
      [user.name, user.email, user.id]
    )
  }
  
  async softDelete(id: string): Promise<void> {
    await this.db.execute(
      `UPDATE users SET
         is_deleted = 1, updated_at = unixepoch(),
         sync_status = 'pending'
       WHERE id = ?`,
      [id]
    )
  }
  
  async getById(id: string): Promise<User | null> {
    const result = await this.db.execute(
      'SELECT * FROM users WHERE id = ? AND is_deleted = 0',
      [id]
    )
    return result.rows.length > 0 ? result.rows.item(0) : null
  }
  
  async getAll(): Promise<User[]> {
    const result = await this.db.execute(
      'SELECT * FROM users WHERE is_deleted = 0 ORDER BY updated_at DESC'
    )
    return result.rows.raw()
  }
  
  async getPendingSync(): Promise<User[]> {
    const result = await this.db.execute(
      'SELECT * FROM users WHERE sync_status = ? AND is_deleted = 0',
      ['pending']
    )
    return result.rows.raw()
  }
  
  async markSynced(id: string): Promise<void> {
    await this.db.execute(
      'UPDATE users SET sync_status = ? WHERE id = ?',
      ['synced', id]
    )
  }
}
```

### Example 3: Network Connectivity Monitor
```typescript
// connectivity.ts
import { NetInfoState, NetInfoSubscription, addEventListener } from '@react-native-netinfo/ios'

type ConnectivityChangeListener = (isConnected: boolean, details: NetInfoState) => void

class ConnectivityMonitor {
  private listeners: Set<ConnectivityChangeListener> = new Set()
  private subscription: NetInfoSubscription | null = null
  private currentState: NetInfoState | null = null
  
  startMonitoring(): void {
    this.subscription = addEventListener((state) => {
      this.currentState = state
      const isConnected = state.isConnected
      this.listeners.forEach(listener => listener(isConnected, state))
    })
  }
  
  stopMonitoring(): void {
    if (this.subscription) {
      this.subscription()
      this.subscription = null
    }
  }
  
  addListener(listener: ConnectivityChangeListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  getCurrentState(): NetInfoState | null {
    return this.currentState
  }
  
  isConnected(): boolean {
    return this.currentState?.isConnected || false
  }
  
  getConnectionType(): string {
    return this.currentState?.type || 'unknown'
  }
  
  isWifi(): boolean {
    return this.currentState?.type === 'wifi'
  }
  
  isCellular(): boolean {
    return this.currentState?.type === 'cellular'
  }
}

// React hook for connectivity
function useConnectivity(): { isConnected: boolean; connectionType: string } {
  const [connectivity, setConnectivity] = useState({ isConnected: true, connectionType: 'unknown' })
  
  useEffect(() => {
    const monitor = new ConnectivityMonitor()
    
    const unsubscribe = monitor.addListener((isConnected, state) => {
      setConnectivity({
        isConnected,
        connectionType: state.type
      })
    })
    
    monitor.startMonitoring()
    
    return () => {
      unsubscribe()
      monitor.stopMonitoring()
    }
  }, [])
  
  return connectivity
}
```

### Example 4: Background Sync Worker
```typescript
// background-sync.ts
import { AppState } from 'react-native'
import BackgroundTask from 'react-native-background-fetch'

class BackgroundSyncManager {
  private isSyncing = false
  private pendingSync = false
  
  async initialize(): Promise<void> {
    const status = await BackgroundTask.configure({
      minimumFetchInterval: 15,
      stopOnTerminate: false,
      startOnBoot: true,
      requiredNetworkType: BackgroundTask.NETWORK_TYPE_ANY,
    })
    
    if (status === BackgroundTask.STATUS_AVAILABLE) {
      await BackgroundTask.registerBackgroundTask(
        'sync-task',
        this.performSync.bind(this)
      )
    }
  }
  
  async performSync(): Promise<void> {
    if (this.isSyncing) {
      this.pendingSync = true
      return
    }
    
    this.isSyncing = true
    
    try {
      const connectivity = new ConnectivityMonitor()
      if (!connectivity.isConnected()) {
        return
      }
      
      const syncManager = new SyncManager()
      const result = await syncManager.syncAll()
      
      console.log('Background sync completed:', result)
      
      if (result.failed > 0) {
        await this.scheduleRetry(result.failed)
      }
    } catch (error) {
      console.error('Background sync failed:', error)
    } finally {
      this.isSyncing = false
      
      if (this.pendingSync) {
        this.pendingSync = false
        await this.performSync()
      }
    }
    
    BackgroundTask.finish('sync-task')
  }
  
  private async scheduleRetry(failedCount: number): Promise<void> {
    // Exponential backoff for retries
    const delay = Math.min(1000 * Math.pow(2, failedCount), 300000)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    await BackgroundTask.registerBackgroundTask(
      'retry-sync-task',
      this.performSync.bind(this)
    )
  }
}

// Sync Manager with queue processing
class SyncManager {
  private userRepository: UserRepository
  private postRepository: PostRepository
  private conflictResolver: ConflictResolver
  
  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0, conflicts: 0 }
    
    // Sync users
    const userResult = await this.syncUsers()
    result.success += userResult.success
    result.failed += userResult.failed
    result.conflicts += userResult.conflicts
    
    // Sync posts
    const postResult = await this.syncPosts()
    result.success += postResult.success
    result.failed += postResult.failed
    result.conflicts += postResult.conflicts
    
    return result
  }
  
  private async syncUsers(): Promise<SyncResult> {
    const pendingUsers = await this.userRepository.getPendingSync()
    const result: SyncResult = { success: 0, failed: 0, conflicts: 0 }
    
    for (const user of pendingUsers) {
      try {
        const remoteUser = await this.fetchRemoteUser(user.id)
        
        if (remoteUser) {
          const conflict = await this.conflictResolver.resolve(user, remoteUser)
          
          if (conflict.resolution === 'MERGE') {
            await this.userRepository.update(conflict.merged!)
            await this.updateRemoteUser(conflict.merged!)
          } else if (conflict.resolution === 'REMOTE') {
            await this.userRepository.update(remoteUser)
          }
          result.conflicts++
        } else {
          await this.updateRemoteUser(user)
        }
        
        await this.userRepository.markSynced(user.id)
        result.success++
      } catch (error) {
        await this.userRepository.markSyncFailed(user.id)
        result.failed++
      }
    }
    
    return result
  }
}
```

### Example 5: Conflict Resolution Strategies
```typescript
// conflict-resolver.ts

// Timestamp-based resolution
class LastWriteWinsResolver<T extends { updatedAt: number }> {
  resolve(local: T, remote: T): ConflictResolution<T> {
    if (local.updatedAt >= remote.updatedAt) {
      return { resolution: 'LOCAL', entity: local }
    } else {
      return { resolution: 'REMOTE', entity: remote }
    }
  }
}

// Field-level merge resolver
class FieldMergeResolver<T extends { version: number }> {
  resolve(local: T, remote: T, mergeFields: (local: T, remote: T) => T): ConflictResolution<T> {
    const localVersion = local.version || 0
    const remoteVersion = remote.version || 0
    
    if (localVersion > remoteVersion) {
      return { resolution: 'LOCAL', entity: local }
    } else if (remoteVersion > localVersion) {
      return { resolution: 'REMOTE', entity: remote }
    } else {
      // Same version - merge fields
      const merged = mergeFields(local, remote)
      merged.version = Math.max(localVersion, remoteVersion) + 1
      return { resolution: 'MERGE', entity: merged }
    }
  }
}

// Semantic conflict resolver for specific entity types
class UserConflictResolver {
  resolve(local: User, remote: User): ConflictResolution<User> {
    const mergeFields = (local: User, remote: User): User => {
      return {
        id: local.id,
        // Take latest name
        name: local.updatedAt >= remote.updatedAt ? local.name : remote.name,
        // Prefer non-empty email
        email: local.email || remote.email,
        // Take latest version
        version: Math.max(local.version, remote.version) + 1,
        updatedAt: Date.now()
      }
    }
    
    const resolver = new FieldMergeResolver<User>()
    return resolver.resolve(local, remote, mergeFields)
  }
}

// Three-way merge with base version
class ThreeWayMergeResolver<T extends { id: string; version: number }> {
  resolve(local: T, remote: T, base: T | null): ConflictResolution<T> {
    const hasBase = base !== null
    const baseVersion = base?.version || 0
    
    const localChanged = local.version !== baseVersion
    const remoteChanged = remote.version !== baseVersion
    
    if (!localChanged) {
      return { resolution: 'REMOTE', entity: remote }
    } else if (!remoteChanged) {
      return { resolution: 'LOCAL', entity: local }
    } else if (hasBase && JSON.stringify(local) === JSON.stringify(base)) {
      return { resolution: 'REMOTE', entity: remote }
    } else if (hasBase && JSON.stringify(remote) === JSON.stringify(base)) {
      return { resolution: 'LOCAL', entity: local }
    } else {
      // Both changed - use merge fields strategy
      return {
        resolution: 'MERGE',
        entity: { ...remote, version: Math.max(local.version, remote.version) + 1 }
      }
    }
  }
}
```

## Best Practices

- Always assume offline first; treat connectivity as an enhancement
- Use SQLite or Realm for reliable local data persistence
- Implement optimistic UI updates for immediate user feedback
- Queue operations when offline with persistent storage
- Use version numbers or timestamps for conflict detection
- Implement exponential backoff for sync retries
- Use background fetch for periodic sync when app is idle
- Provide clear UI indicators for sync status
- Implement proper conflict resolution strategies per entity type
- Test thoroughly with simulated network conditions

## Core Competencies

- Local data persistence (SQLite, Realm, AsyncStorage)
- Synchronization queue management
- Conflict resolution strategies
- Background sync and fetch
- Network connectivity detection
- Optimistic UI updates
- Delta synchronization
- Version control and data merging
- Offline-first UI patterns
- Push notification sync triggers
- Data migration and schema evolution
- Testing with network simulation
- Security considerations for offline data
- Battery optimization strategies

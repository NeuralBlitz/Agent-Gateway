---
name: react-native
description: Cross-platform mobile framework using React and JavaScript
category: mobile-development
difficulty: intermediate
tags: [mobile, react, cross-platform, javascript]
author: Meta Platforms
version: 0.73
last_updated: 2024-01-15
---

# React Native

## What I Do

I am React Native, Meta's open-source framework for building native mobile applications using React and JavaScript. I enable developers to create cross-platform apps for iOS and Android using a single codebase while rendering to native components. My architecture uses a JavaScript thread communicating with native modules through a bridge, enabling access to device capabilities like camera, contacts, and sensors. I leverage React's component-based architecture, JSX syntax, and state management patterns. My hot reload feature allows instant preview of changes without rebuilding. The new architecture with Fabric and TurboModules improves performance and interoperability. I integrate seamlessly with native code when needed for performance-critical features or platform-specific implementations.

## When to Use Me

- Building cross-platform mobile apps from a single codebase
- Teams with React web experience extending to mobile
- Projects requiring iOS and Android coverage with limited resources
- Rapid prototyping and MVP development
- Apps with moderate native integration needs
- Components that can share logic between web and mobile
- When App Store and Play Store distribution are required
- Startups and agencies optimizing for development velocity

## Core Concepts

**Native Components**: iOS and Android UI components exposed as JavaScript modules (View, Text, Image, ScrollView).

**Bridge Architecture**: Communication layer between JavaScript thread and native modules for asynchronous operations.

**React Fundamentals**: JSX, hooks, context, and React patterns apply directly to React Native development.

**Flexbox Layout**: CSS flexbox implementation adapted for mobile layouts without float or percent positioning.

**Native Modules**: JavaScript interfaces to native code for platform-specific features and APIs.

**Hermes Engine**: Optimized JavaScript engine for React Native with AOT compilation on Android.

**Expo**: Open-source platform providing build tools, APIs, and services for React Native development.

## Code Examples

### Example 1: React Native Components with Hooks
```javascript
// App.js
import React, { useState, useEffect, useCallback } from 'react'
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native'

const UserCard = ({ user, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.avatarContainer}>
      <Text style={styles.avatarText}>
        {user.name.charAt(0).toUpperCase()}
      </Text>
    </View>
    <View style={styles.infoContainer}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
)

const App = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('https://api.example.com/users')
      const data = await response.json()
      setUsers(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
  }, [fetchUsers])
  
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])
  
  const renderItem = ({ item }) => (
    <UserCard 
      user={item} 
      onPress={() => navigation.navigate('UserDetail', { userId: item.id })}
    />
  )
  
  const keyExtractor = (item) => item.id.toString()
  
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    )
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <Text style={styles.headerSubtitle}>{users.length} users</Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchUsers}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4
  },
  listContent: {
    padding: 16
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold'
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12
  },
  name: {
    fontSize: 16,
    fontWeight: '600'
  },
  email: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC'
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    padding: 16,
    margin: 16,
    borderRadius: 8
  },
  errorText: {
    color: '#FFFFFF'
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 8
  }
})

export default App
```

### Example 2: Native Modules for Platform APIs
```javascript
// NativeModules/Biometrics.ts
import { NativeModules } from 'react-native'

const { Biometrics } = NativeModules

export const authenticateWithBiometrics = async (): Promise<boolean> => {
  try {
    const hasBiometrics = await Biometrics.hasBiometrics()
    if (!hasBiometrics) {
      throw new Error('Biometrics not available')
    }
    
    const result = await Biometrics.authenticate('Authenticate to continue')
    return result.success
  } catch (error) {
    console.error('Biometric authentication failed:', error)
    return false
  }
}

export const getBiometricType = (): string => {
  return Biometrics.getBiometricType()
}
```

```swift
// BiometricsModule.swift (iOS)
import LocalAuthentication

@objc(Biometrics)
class Biometrics: NSObject {
  
  @objc(hasBiometrics:(_ callback: @escaping (Bool) -> Void)) {
    let context = LAContext()
    var error: NSError?
    
    guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
      callback(false)
      return
    }
    
    callback(true)
  }
  
  @objc(authenticate:(_ reason: String, _ callback: @escaping (NSDictionary) -> Void)) {
    let context = LAContext()
    var error: NSError?
    
    guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
      callback(["success": false, "error": error?.localizedDescription ?? "Unknown error"])
      return
    }
    
    context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, error in
      callback(["success": success, "error": error?.localizedDescription])
    }
  }
  
  @objc(getBiometricType:(_ callback: @escaping (String) -> Void)) {
    let context = LAContext()
    var error: NSError?
    
    guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
      callback("none")
      return
    }
    
    switch context.biometryType {
    case .faceID:
      callback("face")
    case .touchID:
      callback("touch")
    case .opticID:
      callback("optic")
    default:
      callback("none")
    }
  }
}
```

```java
// BiometricsModule.java (Android)
package com.example.biometrics

import android.content.Context
import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

class BiometricsModule(reactContext: ReactContext) : ReactContextBaseJavaModule(reactContext) {
  
  override fun getName(): String = "Biometrics"
  
  @ReactMethod
  fun hasBiometrics(promise: Promise) {
    val biometricManager = BiometricManager.from(currentActivity)
    val result = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
    
    promise.resolve(result == BiometricManager.BIOMETRIC_SUCCESS)
  }
  
  @ReactMethod
  fun authenticate(reason: String, promise: Promise) {
    val activity = currentActivity as? FragmentActivity ?: run {
      promise.reject("ACTIVITY_REQUIRED", "Activity required")
      return
    }
    
    val executor = ContextCompat.getMainExecutor(activity)
    
    val callback = object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        promise.reject("AUTH_ERROR", errString.toString())
      }
      
      override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        promise.resolve(true)
      }
      
      override fun onAuthenticationFailed() {
        // Don't reject here, let user retry
      }
    }
    
    val promptInfo = BiometricPrompt.PromptInfo.Builder()
      .setTitle(reason)
      .setNegativeButtonText("Cancel")
      .build()
    
    BiometricPrompt(activity, executor, callback).authenticate(promptInfo, callback)
  }
  
  @ReactMethod
  fun getBiometricType(promise: Promise) {
    val biometricManager = BiometricManager.from(currentActivity)
    
    when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
      BiometricManager.BIOMETRIC_SUCCESS -> promise.resolve("biometric")
      else -> promise.resolve("none")
    }
  }
}
```

### Example 3: State Management with Context and Reducer
```javascript
// UserContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react'

const UserContext = createContext(null)
const UserDispatchContext = createContext(null)

const initialState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null
}

function userReducer(state, action) {
  switch (action.type) {
    case 'LOAD_USERS_START':
      return { ...state, loading: true, error: null }
    case 'LOAD_USERS_SUCCESS':
      return { ...state, users: action.payload, loading: false }
    case 'LOAD_USERS_FAILURE':
      return { ...state, error: action.payload, loading: false }
    case 'SELECT_USER':
      return { ...state, selectedUser: action.payload }
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? action.payload : user
        )
      }
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload)
      }
    default:
      return state
  }
}

export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, initialState)
  
  return (
    <UserContext.Provider value={state}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UserContext)
  if (context === null) {
    throw new Error('useUsers must be used within a UserProvider')
  }
  return context
}

export function useUserDispatch() {
  const context = useContext(UserDispatchContext)
  if (context === null) {
    throw new Error('useUserDispatch must be used within a UserProvider')
  }
  return context
}

export function useUser(userId) {
  const state = useUsers()
  return state.users.find(user => user.id === userId)
}
```

### Example 4: Navigation with React Navigation
```javascript
// navigation/index.js
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import HomeScreen from '../screens/HomeScreen'
import ProfileScreen from '../screens/ProfileScreen'
import SettingsScreen from '../screens/SettingsScreen'
import UserDetailScreen from '../screens/UserDetailScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Home" 
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="UserDetail" 
      component={UserDetailScreen}
      options={({ route }) => ({ 
        title: route.params.userName,
        headerBackTitleVisible: false
      })}
    />
  </Stack.Navigator>
)

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName
        
        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline'
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline'
        } else if (route.name === 'Settings') {
          iconName = focused ? 'settings' : 'settings-outline'
        }
        
        return <Ionicons name={iconName} size={size} color={color} />
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#8E8E93',
      headerShown: false
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeStack}
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
    />
  </Tab.Navigator>
)

const AppNavigation = () => (
  <NavigationContainer>
    <TabNavigator />
  </NavigationContainer>
)

export default AppNavigation
```

### Example 5: Offline Storage with AsyncStorage
```javascript
// storage/offlineStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage'

const USERS_KEY = '@users'
const CACHE_TIMESTAMP_KEY = '@users_cache_timestamp'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const cacheUsers = async (users) => {
  try {
    const timestamp = Date.now()
    const cacheData = {
      timestamp,
      users
    }
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users))
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString())
  } catch (error) {
    console.error('Error caching users:', error)
  }
}

export const getCachedUsers = async () => {
  try {
    const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY)
    const usersStr = await AsyncStorage.getItem(USERS_KEY)
    
    if (!timestampStr || !usersStr) {
      return null
    }
    
    const timestamp = parseInt(timestampStr, 10)
    const now = Date.now()
    
    if (now - timestamp > CACHE_DURATION) {
      await clearUserCache()
      return null
    }
    
    return JSON.parse(usersStr)
  } catch (error) {
    console.error('Error getting cached users:', error)
    return null
  }
}

export const clearUserCache = async () => {
  try {
    await AsyncStorage.removeItem(USERS_KEY)
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY)
  } catch (error) {
    console.error('Error clearing user cache:', error)
  }
}

export const getOfflineUsers = async () => {
  const cached = await getCachedUsers()
  return cached
}

export const syncOfflineChanges = async (offlineChanges) => {
  try {
    for (const change of offlineChanges) {
      if (change.type === 'CREATE') {
        await AsyncStorage.setItem(`offline_create_${change.id}`, JSON.stringify(change.data))
      } else if (change.type === 'UPDATE') {
        await AsyncStorage.setItem(`offline_update_${change.id}`, JSON.stringify(change.data))
      } else if (change.type === 'DELETE') {
        await AsyncStorage.setItem(`offline_delete_${change.id}`, change.id.toString())
      }
    }
  } catch (error) {
    console.error('Error syncing offline changes:', error)
  }
}
```

## Best Practices

- Use functional components with hooks over class components
- Leverage React Navigation for routing with proper navigation patterns
- Implement offline-first architecture with AsyncStorage or SQLite
- Use platform-specific code with Platform.select for iOS/Android differences
- Optimize list rendering with FlatList's keyExtractor and optimization props
- Use React Native Debugger for debugging JavaScript and Redux
- Test with Jest for unit tests and Detox for E2E testing
- Use Expo for rapid development; eject for custom native code
- Implement proper error boundaries and crash reporting
- Use React Native Performance Monitor for performance profiling

## Core Competencies

- Native UI components and cross-platform rendering
- Bridge architecture and native module development
- Flexbox layout system for mobile
- React hooks (useState, useEffect, useCallback, useMemo)
- State management (Context, Redux, Zustand)
- Navigation patterns with React Navigation
- Native modules for platform APIs
- Offline storage with AsyncStorage and SQLite
- Performance optimization techniques
- Debugging and development tools
- Testing strategies (Jest, Detox)
- Expo framework and services
- Hermes JavaScript engine optimization

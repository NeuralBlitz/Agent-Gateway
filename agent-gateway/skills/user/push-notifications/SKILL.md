---
name: push-notifications
description: Mobile push notification implementation and management
category: mobile-development
difficulty: intermediate
tags: [mobile, notifications, firebase, apns]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Push Notifications

## What I Do

I am Push Notifications, a system for delivering time-sensitive messages to mobile devices even when the app is not running. I enable apps to re-engage users with relevant content, alerts, and updates through APNs (Apple Push Notification service) on iOS and Firebase Cloud Messaging on Android. I handle device token registration, notification payload construction, and delivery management. I support rich notifications with images, actions, and custom UI. I integrate with backend services for targeted messaging based on user behavior, demographics, or segments. I provide analytics on delivery rates, open rates, and user engagement. I respect user preferences and permission models, allowing users to opt in or out of notification categories.

## When to Use Me

- Re-engaging users with timely updates
- Sending time-sensitive alerts (orders, appointments)
- Breaking news and content updates
- Social interactions and activity notifications
- Marketing campaigns and promotions
- Transactional notifications (payments, shipping)
- Reminders and to-do items
- Cross-platform user communication
- Silent notifications for background updates

## Core Concepts

**Device Tokens**: Unique identifiers for each app installation, used to route notifications to specific devices.

**Notification Payload**: JSON structure containing notification content and configuration options.

**Notification Categories**: User-configurable groupings for notification preferences.

**Rich Notifications**: Notifications with images, videos, and custom UI extensions.

**Silent Notifications**: Background notifications without user-facing alerts for data sync.

**Action Buttons**: Custom actions from notifications (reply, acknowledge, open).

**Local vs Remote**: Local notifications scheduled within the app vs remote notifications from servers.

## Code Examples

### Example 1: Push Notification Setup (React Native)
```typescript
// notification-service.ts
import messaging from '@react-native-firebase/messaging'
import { Permissions, Platform } from 'react-native'

class NotificationService {
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission()
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      
      if (enabled) {
        console.log('Push notification permission granted')
        return true
      }
      
      console.log('Push notification permission denied')
      return false
    } catch (error) {
      console.error('Permission request error:', error)
      return false
    }
  }
  
  async getDeviceToken(): Promise<string | null> {
    try {
      const hasPermission = await this.checkPermission()
      if (!hasPermission) {
        await this.requestPermission()
      }
      
      const token = await messaging().getToken()
      console.log('Device token:', token)
      return token
    } catch (error) {
      console.error('Failed to get device token:', error)
      return null
    }
  }
  
  async checkPermission(): Promise<boolean> {
    const authStatus = await messaging().hasPermission()
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    )
  }
  
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic)
      console.log(`Subscribed to topic: ${topic}`)
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error)
    }
  }
  
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic)
      console.log(`Unsubscribed from topic: ${topic}`)
    } catch (error) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error)
    }
  }
}

export const notificationService = new NotificationService()
```

### Example 2: Notification Handling and Foreground Handling
```typescript
// notification-handler.ts
import messaging from '@react-native-firebase/messaging'
import { AppRegistry } from 'react-native'
import { navigationRef } from './navigation'

class NotificationHandler {
  initialize(): void {
    // Foreground notification listener
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage)
      this.showLocalNotification(remoteMessage)
    })
    
    // Background notification handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification received:', remoteMessage)
      this.handleBackgroundNotification(remoteMessage)
    })
    
    // Notification opened app from quit state
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage)
        this.handleNotificationNavigation(remoteMessage)
      }
    })
    
    // Notification opened when app is in background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('App opened from background notification:', remoteMessage)
      this.handleNotificationNavigation(remoteMessage)
    })
  }
  
  private showLocalNotification(remoteMessage: messaging.RemoteMessage): void {
    const notification: NotificationRequest = {
      id: remoteMessage.messageId || Date.now().toString(),
      title: remoteMessage.notification?.title || 'New Message',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data,
    }
    
    // Show local notification using your preferred library
    // e.g., notifee, react-native-push-notification
  }
  
  private handleBackgroundNotification(remoteMessage: messaging.RemoteMessage): void {
    // Handle background notification - potentially update local storage
    // or trigger background sync
    if (remoteMessage.data?.type === 'MESSAGE') {
      this.storeMessageLocally(remoteMessage.data)
    }
  }
  
  private handleNotificationNavigation(remoteMessage: messaging.RemoteMessage): void {
    const { screen, params } = this.parseNotificationData(remoteMessage.data)
    
    if (navigationRef.isReady()) {
      navigationRef.navigate(screen, params)
    }
  }
  
  private parseNotificationData(data: Record<string, string>): { screen: string; params: object } {
    const screen = data?.screen || 'Home'
    const params = { ...data }
    delete params.screen
    return { screen, params }
  }
  
  private storeMessageLocally(data: Record<string, string>): void {
    // Store notification data locally
    console.log('Storing message:', data)
  }
}

export const notificationHandler = new NotificationHandler()
```

### Example 3: Backend Notification Service (Node.js)
```typescript
// notification-service.ts
import admin from 'firebase-admin'

interface NotificationPayload {
  token: string
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
  actions?: NotificationAction[]
  channelId?: string
  priority?: 'high' | 'normal'
  ttl?: number
}

interface NotificationAction {
  action: string
  title: string
  icon?: string
  foreground?: boolean
  authenticationRequired?: boolean
}

class FirebaseNotificationService {
  private admin: admin.app.App
  
  constructor() {
    this.admin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  }
  
  async sendNotification(payload: NotificationPayload): Promise<string> {
    const message: admin.messaging.Message = {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        priority: payload.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: payload.channelId || 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          color: '#007AFF',
        },
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1,
            'content-available': payload.data?.silent ? 1 : 0,
          },
        },
        fcmOptions: {
          imageUrl: payload.imageUrl,
        },
      },
    }
    
    if (payload.actions && payload.actions.length > 0) {
      message.android!.notification!.actions = payload.actions.map((action, index) => ({
        title: action.title,
        icon: action.icon,
        action: action.action,
        ...(action.foreground && { launchActivity: 'default' }),
      }))
      
      message.apns!.payload!.aps!.category = 'MESSAGE_ACTION'
    }
    
    try {
      const response = await this.admin.messaging().send(message)
      console.log('Successfully sent notification:', response)
      return response
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }
  
  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<admin.messaging.BatchResponse> {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data: data || {},
    }
    
    return this.admin.messaging().sendEachForMulticast(message)
  }
  
  async sendTopicNotification(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<string> {
    const message: admin.messaging.Message = {
      topic,
      notification: { title, body },
      data: data || {},
    }
    
    return this.admin.messaging().send(message)
  }
}

export const firebaseNotificationService = new FirebaseNotificationService()
```

### Example 4: Notification Categories and Actions (iOS)
```swift
// NotificationCategories.swift
import UserNotifications

struct NotificationCategory {
  static let messages = "MESSAGES"
  static let orders = "ORDERS"
  static let reminders = "REMINDERS"
}

struct NotificationAction {
  static let reply = "REPLY_ACTION"
  static let view = "VIEW_ACTION"
  static let dismiss = "DISMISS_ACTION"
  static let accept = "ACCEPT_ACTION"
  static let decline = "DECLINE_ACTION"
}

class NotificationManager {
  static let shared = NotificationManager()
  
  private init() {}
  
  func registerCategories() {
    let messagesCategory = UNNotificationCategory(
      identifier: NotificationCategory.messages,
      actions: [
        UNNotificationAction(
          identifier: NotificationAction.reply,
          title: "Reply",
          options: [.foreground]
        ),
        UNNotificationAction(
          identifier: NotificationAction.view,
          title: "View",
          options: [.foreground]
        ),
        UNNotificationAction(
          identifier: NotificationAction.dismiss,
          title: "Dismiss",
          options: [.destructive]
        )
      ],
      intentIdentifiers: [],
      options: []
    )
    
    let ordersCategory = UNNotificationCategory(
      identifier: NotificationCategory.orders,
      actions: [
        UNNotificationAction(
          identifier: NotificationAction.view,
          title: "View Order",
          options: [.foreground]
        ),
        UNNotificationAction(
          identifier: NotificationAction.dismiss,
          title: "Dismiss",
          options: [.destructive]
        )
      ],
      intentIdentifiers: [],
      options: []
    )
    
    let remindersCategory = UNNotificationCategory(
      identifier: NotificationCategory.reminders,
      actions: [
        UNNotificationAction(
          identifier: NotificationAction.accept,
          title: "Accept",
          options: [.foreground]
        ),
        UNNotificationAction(
          identifier: NotificationAction.decline,
          title: "Decline",
          options: [.destructive]
        )
      ],
      intentIdentifiers: [],
      options: []
    )
    
    UNUserNotificationCenter.current().setNotificationCategories([
      messagesCategory,
      ordersCategory,
      remindersCategory
    ])
  }
}
```

### Example 5: Local Notifications
```typescript
// local-notifications.ts
import PushNotification from 'react-native-push-notification'

class LocalNotificationService {
  configure(): void {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Local notification token:', token)
      },
      onNotification: (notification) => {
        console.log('Local notification received:', notification)
        this.handleNotificationAction(notification)
      },
      onAction: (notification) => {
        console.log('Notification action:', notification.action)
        this.handleNotificationAction(notification)
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    })
  }
  
  createChannel(): void {
    PushNotification.createChannel(
      {
        channelId: 'default',
        channelName: 'Default Notifications',
        channelDescription: 'General app notifications',
        playSound: true,
        soundName: 'default',
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    )
    
    PushNotification.createChannel(
      {
        channelId: 'messages',
        channelName: 'Messages',
        channelDescription: 'Chat and message notifications',
        playSound: true,
        soundName: 'message.mp3',
        importance: 4,
      },
      (created) => console.log(`Channel created: ${created}`)
    )
  }
  
  scheduleNotification(
    id: string,
    title: string,
    body: string,
    date: Date,
    data?: object
  ): void {
    PushNotification.localNotificationSchedule({
      id,
      title,
      message: body,
      date,
      allowWhileIdle: false,
      channelId: 'default',
      data: data || {},
      repeatType: 'day',
      repeatTime: 1,
    })
  }
  
  showNotification(
    id: string,
    title: string,
    body: string,
    data?: object
  ): void {
    PushNotification.localNotification({
      id: id,
      title: title,
      message: body,
      channelId: 'default',
      userInteraction: true,
      data: data || {},
    })
  }
  
  cancelNotification(id: string): void {
    PushNotification.cancelLocalNotification(id)
  }
  
  cancelAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications()
  }
  
  setBadgeCount(count: number): void {
    PushNotification.setApplicationIconBadgeNumber(count)
  }
  
  private handleNotificationAction(notification: any): void {
    if (notification.action === 'REPLY_ACTION') {
      this.handleReplyAction(notification)
    } else if (notification.action === 'VIEW_ACTION') {
      this.handleViewAction(notification)
    }
  }
  
  private handleReplyAction(notification: any): void {
    // Handle notification reply
    console.log('Reply to:', notification.remote?.senderId)
  }
  
  private handleViewAction(notification: any): void {
    // Navigate to specific screen
    const { screen, params } = this.parseNotificationData(notification.data)
    // Navigate using navigation service
  }
}

export const localNotificationService = new LocalNotificationService()
```

## Best Practices

- Request notification permission early but not immediately on launch
- Provide clear value proposition for enabling notifications
- Respect user notification preferences and categories
- Use silent notifications sparingly for background sync only
- Implement notification grouping on iOS for better UX
- Provide notification center management on Android
- Use appropriate notification importance levels on Android
- Test notifications on real devices before release
- Monitor delivery and open rates for optimization
- Implement proper analytics for notification performance

## Core Competencies

- APNs and Firebase Cloud Messaging integration
- Device token management
- Notification payload construction
- Rich notifications with actions
- Notification channels (Android)
- Notification categories (iOS)
- Silent background notifications
- Local notifications scheduling
- Notification analytics and tracking
- Permission management
- Deep linking from notifications
- Notification extensions
- Badge management
- Sound and vibration control
- Cross-platform implementation

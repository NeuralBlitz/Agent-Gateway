---
name: Push Notifications
description: Mobile push notification implementation and management
license: MIT
compatibility: iOS (APNs), Android (FCM), Cross-platform SDKs
audience: Mobile developers implementing notification systems
category: Mobile Development
---

# Push Notifications

## What I Do

I provide guidance for implementing mobile push notifications across platforms. I cover APNs setup, FCM integration, notification channels, rich notifications, and notification analytics.

## When to Use Me

- Implementing push notifications in mobile apps
- Setting up notification infrastructure
- Creating rich notification interfaces
- Handling notification taps and actions
- Optimizing notification delivery and engagement

## Core Concepts

- **APNs (Apple Push Notification service)**: Apple's cloud notification service
- **FCM (Firebase Cloud Messaging)**: Google's cross-platform messaging
- **Device Tokens**: Unique identifiers for device targeting
- **Notification Payload**: JSON structure for notification data
- **Notification Channels**: Android's categorization system
- **Rich Notifications**: Custom UI for notifications
- **Notification Actions**: Interactive notification buttons
- **Silent Notifications**: Background data delivery
- **Notification Groups**: Bundling related notifications
- **Push Certificate Management**: Auth credentials for services

## Code Examples

### FCM with Flutter

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  
  Future<void> initialize() async {
    await _requestPermission();
    await _setupLocalNotifications();
    await _setupForegroundHandler();
    await _setupBackgroundHandler();
  }
  
  Future<void> _requestPermission() async {
    NotificationSettings settings =
        await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('Notification permission granted');
    }
  }
  
  Future<void> _setupLocalNotifications() {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    return _localNotifications.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
      onDidReceiveNotificationResponse: _onNotificationResponse,
    );
  }
  
  void _onNotificationResponse(NotificationResponse response) {
    final payload = response.payload;
    if (payload != null) {
      handleNotificationTap(payload);
    }
  }
  
  Future<String?> getFCMToken() async {
    return await _firebaseMessaging.getToken();
  }
  
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
  }
  
  Future<void> sendNotification({
    required String title,
    required String body,
    required String token,
    Map<String, String>? data,
  }) async {
    await _sendFCMMessage(
      token: token,
      title: title,
      body: body,
      data: data,
    );
  }
  
  Future<void> _sendFCMMessage({
    required String token,
    required String title,
    required String body,
    Map<String, String>? data,
  }) async {
    final response = await http.post(
      Uri.parse('https://fcm.googleapis.com/fcm/send'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=$SERVER_KEY',
      },
      body: jsonEncode({
        'to': token,
        'notification': {
          'title': title,
          'body': body,
          'icon': 'ic_notification',
          'color': '#FF5722',
        },
        'data': data ?? {},
        'android': {
          'priority': 'high',
          'notification': {
            'channel_id': 'default_channel',
            'click_action': 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        'apns': {
          'payload': {
            'aps': {
              'category': 'MESSAGE_CATEGORY',
              'content_available': true,
            },
          },
        },
      }),
    );
    
    if (response.statusCode != 200) {
      throw Exception('FCM send failed: ${response.body}');
    }
  }
}
```

### iOS Notification with Swift

```swift
import UserNotifications
import UIKit

class NotificationManager {
    static let shared = NotificationManager()
    
    private init() {}
    
    func requestAuthorization() async -> Bool {
        let options: UNAuthorizationOptions = [.alert, .badge, .sound]
        
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: options)
            if granted {
                await registerForRemoteNotifications()
            }
            return granted
        } catch {
            print("Authorization error: \(error)")
            return false
        }
    }
    
    func registerForRemoteNotifications() async {
        UNUserNotificationCenter.current().delegate = self
        
        await MainActor.run {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
    
    func handleDeviceToken(_ deviceToken: Data) {
        let tokenParts = deviceToken.map { String(format: "%02.2hhx", $0) }
        let token = tokenParts.joined()
        print("Device Token: \(token)")
        
        NotificationService.shared.sendTokenToServer(token: token)
    }
    
    func scheduleLocalNotification(
        title: String,
        body: String,
        identifier: String,
        date: Date
    ) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.badge = 1
        content.userInfo = ["action": "open"]
        
        content.categoryIdentifier = "MESSAGE_CATEGORY"
        
        let trigger = UNCalendarNotificationTrigger(
            dateMatching: Calendar.current.dateComponents(
                [.year, .month, .day, .hour, .minute],
                from: date
            ),
            repeats: false
        )
        
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to schedule notification: \(error)")
            }
        }
    }
}

extension NotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        return [.banner, .sound, .badge]
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) {
        let userInfo = response.notification.request.content.userInfo
        
        switch response.actionIdentifier {
        case "REPLY_ACTION":
            if let textResponse = response as? UNTextInputNotificationResponse {
                handleReply(userInfo: userInfo, text: textResponse.userText)
            }
        case UNNotificationDefaultActionIdentifier:
            handleNotificationTap(userInfo: userInfo)
        default:
            break
        }
    }
}
```

### Android Notification Channel

```kotlin
class NotificationHelper(private val context: Context) {
    
    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    
    fun createNotificationChannels() {
        val importance = NotificationManager.IMPORTANCE_HIGH
        
        val defaultChannel = NotificationChannel(
            CHANNEL_DEFAULT,
            "Default Notifications",
            importance
        ).apply {
            description = "General app notifications"
            enableLights(true)
            enableVibration(true)
            setShowBadge(true)
        }
        
        val messageChannel = NotificationChannel(
            CHANNEL_MESSAGES,
            "Messages",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Chat and message notifications"
            setShowBadge(true)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        
        val importantChannel = NotificationChannel(
            CHANNEL_IMPORTANT,
            "Important",
            NotificationManager.IMPORTANCE_MAX
        ).apply {
            description = "Critical notifications"
            enableVibration(true)
            setBypassDnd(true)
        }
        
        notificationManager.createNotificationChannels(
            listOf(defaultChannel, messageChannel, importantChannel)
        )
    }
    
    fun showNotification(
        title: String,
        message: String,
        channelId: String = CHANNEL_DEFAULT,
        data: Map<String, String>? = null
    ) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            data?.forEach { (key, value) ->
                putExtra(key, value)
            }
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val replyIntent = Intent(context, ReplyReceiver::class.java)
        val replyPendingIntent = PendingIntent.getBroadcast(
            context,
            1,
            replyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val replyAction = NotificationCompat.Action.Builder(
            IconCompat.createWithResource(context, R.drawable.ic_reply),
            "Reply",
            replyPendingIntent
        ).build()
        
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .addAction(replyAction)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .build()
        
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
    
    companion object {
        const val CHANNEL_DEFAULT = "default"
        const val CHANNEL_MESSAGES = "messages"
        const val CHANNEL_IMPORTANT = "important"
    }
}
```

## Best Practices

1. **Use Notification Channels**: Organize notifications on Android 8+
2. **Request Permissions Early**: Ask for notification permissions at appropriate times
3. **Personalize Notifications**: Use user data to customize content
4. **Implement Notification Deep Links**: Navigate users to relevant content
5. **Batch Notifications**: Use notification summary for multiple items
6. **Respect Do Not Disturb**: Check notification importance levels
7. **Track Analytics**: Measure notification open rates and engagement
8. **Provide Unsubscribe Options**: Let users control notification preferences
9. **Optimize Payload Size**: Keep notification payloads under platform limits
10. **Test on Real Devices**: Notification behavior varies across manufacturers

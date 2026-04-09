---
name: Mobile Security
category: cybersecurity
description: Securing mobile applications on iOS and Android platforms against reverse engineering, data leakage, and runtime attacks
tags: [mobile, ios, android, owasp-mobile, app-hardening]
version: "1.0"
---

# Mobile Security

## What I Do

I provide guidance on securing mobile applications across iOS and Android platforms. This includes secure local storage, certificate pinning, runtime integrity checks, secure inter-process communication, biometric authentication integration, and protection against reverse engineering and tampering.

## When to Use Me

- Implementing secure storage for tokens, keys, or sensitive user data on mobile devices
- Adding certificate pinning to prevent man-in-the-middle attacks
- Protecting against reverse engineering, repackaging, or runtime hooking
- Implementing biometric authentication flows
- Securing inter-app communication via deep links or intents
- Preparing for OWASP Mobile Top 10 compliance review

## Core Concepts

1. **OWASP Mobile Top 10**: Critical risks including improper credential usage, inadequate supply chain security, insecure authentication, insufficient input/output validation, insecure communication, inadequate privacy controls, insufficient binary protections, security misconfiguration, insecure data storage, and insufficient cryptography.
2. **Secure Local Storage**: Use platform keychains (iOS Keychain, Android Keystore) for secrets; never store sensitive data in SharedPreferences, UserDefaults, or SQLite without encryption.
3. **Certificate Pinning**: Pin server certificates or public keys to prevent MITM attacks from compromised CAs.
4. **Runtime Integrity**: Detect jailbreak/root, debugger attachment, and code tampering at runtime.
5. **Binary Protection**: Apply obfuscation, strip debug symbols, and enable platform hardening flags.
6. **Biometric Authentication**: Use platform APIs (LocalAuthentication, BiometricPrompt) with proper fallback and invalidation on biometric changes.
7. **Secure IPC**: Validate all data received through deep links, intents, and URL schemes.

## Code Examples

### 1. Secure Token Storage (iOS Swift - Keychain)

```swift
import Security
import Foundation

struct KeychainHelper {
    static func save(key: String, data: Data) -> OSStatus {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        SecItemDelete(query as CFDictionary)
        return SecItemAdd(query as CFDictionary, nil)
    }

    static func load(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        return status == errSecSuccess ? result as? Data : nil
    }
}
```

### 2. Certificate Pinning (Android Kotlin)

```kotlin
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient

fun createPinnedClient(): OkHttpClient {
    val pinner = CertificatePinner.Builder()
        .add(
            "api.example.com",
            "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
            "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB="
        )
        .build()

    return OkHttpClient.Builder()
        .certificatePinner(pinner)
        .build()
}
```

### 3. Root/Jailbreak Detection (Android Kotlin)

```kotlin
object IntegrityChecker {
    private val rootIndicators = listOf(
        "/system/app/Superuser.apk",
        "/system/xbin/su",
        "/system/bin/su",
        "/sbin/su",
        "/data/local/xbin/su"
    )

    fun isDeviceCompromised(): Boolean {
        return rootIndicators.any { java.io.File(it).exists() } ||
            isDebuggerAttached() ||
            isRunningOnEmulator()
    }

    private fun isDebuggerAttached(): Boolean = android.os.Debug.isDebuggerConnected()

    private fun isRunningOnEmulator(): Boolean {
        return android.os.Build.FINGERPRINT.contains("generic") ||
            android.os.Build.MODEL.contains("Emulator")
    }
}
```

## Best Practices

1. **Store secrets in platform keychains** (iOS Keychain, Android Keystore) with appropriate access control flags.
2. **Pin certificates** for all API communication and include backup pins for key rotation.
3. **Validate all deep link and intent parameters** as untrusted input before processing.
4. **Disable backup** of sensitive data by excluding it from iCloud/Google backups.
5. **Enable platform hardening flags** (PIE, ARC, stack canaries, ASLR) in build configurations.
6. **Implement session timeout** and require re-authentication for sensitive operations.
7. **Use platform biometric APIs** with proper fallback and invalidation on enrollment changes.
8. **Strip debug symbols and logs** from release builds.
9. **Enforce minimum OS versions** to ensure availability of modern security features.
10. **Perform runtime integrity checks** to detect jailbreak, root, hooking frameworks, and debugger attachment.

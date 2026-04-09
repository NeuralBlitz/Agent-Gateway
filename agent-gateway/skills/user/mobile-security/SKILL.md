---
name: mobile-security
description: Mobile app security practices
license: MIT
compatibility: opencode
metadata:
  audience: mobile-developers
  category: mobile-development
---

## What I do

- Secure mobile applications against common vulnerabilities
- Implement secure data storage and encryption
- Protect against reverse engineering and tampering
- Secure network communications
- Implement authentication and authorization
- Handle sensitive data properly
- Conduct security assessments for mobile apps

## When to use me

Use me when:
- Building mobile apps with sensitive user data
- Apps requiring secure payment handling
- Enterprise apps with corporate data
- Apps subject to security compliance (HIPAA, PCI-DSS)
- Implementing biometric authentication
- Preparing security audit documentation

## Key Concepts

### OWASP Mobile Top 10
Critical mobile security risks:
1. Improper Credential Usage
2. Inadequate Supply Chain Security
3. Insecure Authentication/Authorization
4. Insufficient Input/Output Validation
5. Insecure Communication
6. Inadequate Privacy Controls
7. Insufficient Binary Protections
8. Security Misconfiguration
9. Insecure Data Storage
10. Insufficient Cryptography

### Secure Data Storage

**Android (EncryptedSharedPreferences):**
```kotlin
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()

val securePrefs = EncryptedSharedPreferences.create(
    context,
    "secure_prefs",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)

securePrefs.edit().putString("token", authToken).apply()
```

**iOS (Keychain):**
```swift
let query: [String: Any] = [
    kSecClass: kSecClassGenericPassword,
    kSecAttrService: "com.app.service",
    kSecAttrAccount: "authToken",
    kSecValueData: token.data(using: .utf8)!
]

SecItemAdd(query as CFDictionary, nil)
```

### Code Obfuscation
- **Android**: ProGuard, R8, DexGuard
- **iOS**: LLVM obfuscation, symbol stripping

### Network Security
- TLS 1.3 minimum
- Certificate pinning
- No sensitive data in URLs
- Secure WebViews configuration

---
name: Mobile Security
description: Security practices and implementations for mobile applications
license: MIT
compatibility: iOS, Android, Cross-platform
audience: Mobile developers and security engineers
category: Mobile Development
---

# Mobile Security

## What I Do

I provide guidance for securing mobile applications against threats. I cover secure storage, certificate pinning, biometric authentication, obfuscation, and mobile-specific attack vectors.

## When to Use Me

- Implementing authentication and authorization
- Securing sensitive data on devices
- Preventing reverse engineering attacks
- Setting up secure communication
- Meeting compliance requirements (OWASP, GDPR)

## Core Concepts

- **Secure Enclave/TEE**: Hardware security features
- **Keychain Services**: iOS secure credential storage
- **Keystore**: Android secure key storage
- **Certificate Pinning**: Preventing MITM attacks
- **Obfuscation**: Code protection against reverse engineering
- **Root/Jailbreak Detection**: Identifying compromised devices
- **SSL/TLS Configuration**: Secure network communication
- **Data Encryption**: Protecting stored sensitive information
- **Input Validation**: Preventing injection attacks
- **Anti-Tampering**: Detecting app modifications

## Code Examples

### Secure Storage with Biometrics

```swift
import LocalAuthentication
import Security

class SecureStorage {
    
    static let shared = SecureStorage()
    
    private let service = "com.app.secure"
    
    func storeCredential(_ credential: String, forKey key: String) throws {
        guard let data = credential.data(using: .utf8) else {
            throw SecureStorageError.encodingFailed
        }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw SecureStorageError.unableToStore(status)
        }
    }
    
    func retrieveCredential(forKey key: String) throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                return nil
            }
            throw SecureStorageError.unableToRetrieve(status)
        }
        
        guard let data = result as? Data,
              let credential = String(data: data, encoding: .utf8) else {
            throw SecureStorageError.decodingFailed
        }
        
        return credential
    }
    
    func authenticateWithBiometrics() async throws -> Bool {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        ) else {
            throw BiometricError.notAvailable
        }
        
        let reason = "Authenticate to access secure data"
        
        return await withCheckedContinuation { continuation in
            context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            ) { success, error in
                continuation.resume(returning: success)
            }
        }
    }
    
    func storeWithBiometricProtection(_ data: Data, forKey key: String) async throws {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        ) else {
            throw BiometricError.notAvailable
        }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        var accessControl: SecAccessControl?
        var status = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            .biometryCurrentSet,
            &accessControl
        )
        
        guard status == errSecSuccess, let access = accessControl else {
            throw SecureStorageError.accessControlFailed
        }
        
        var mutableQuery = query
        mutableQuery[kSecAttrAccessControl as String] = access
        
        SecItemDelete(mutableQuery as CFDictionary)
        
        status = SecItemAdd(mutableQuery as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw SecureStorageError.unableToStore(status)
        }
    }
}

enum SecureStorageError: Error {
    case encodingFailed
    case decodingFailed
    case unableToStore(OSStatus)
    case unableToRetrieve(OSStatus)
    case accessControlFailed
}

enum BiometricError: Error {
    case notAvailable
    case notEnrolled
    case lockout
}
```

### Android Keystore with Encryption

```kotlin
import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class SecureStorage(private val context: Context) {
    
    private val keyStore: KeyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply {
        load(null)
    }
    
    private val masterKey: MasterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .setUserAuthenticationRequired(true)
        .setUserAuthenticationParameters(
            30,
            KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL
        )
        .build()
    
    private val encryptedPrefs: SharedPreferences =
        EncryptedSharedPreferences.create(
            context,
            "secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    
    fun storeToken(token: String) {
        encryptedPrefs.edit().putString("auth_token", token).apply()
    }
    
    fun getToken(): String? {
        return encryptedPrefs.getString("auth_token", null)
    }
    
    fun storeSensitiveData(data: String, key: String) {
        val cipher = Cipher.getInstance(
            "${KeyProperties.KEY_ALGORITHM_AES}/ECB/PKCS7Padding"
        )
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateSecretKey())
        
        val encryptedBytes = cipher.doFinal(data.toByteArray(Charsets.UTF_8))
        val encryptedData = android.util.Base64.encodeToString(
            encryptedBytes,
            android.util.Base64.NO_WRAP
        )
        
        encryptedPrefs.edit().putString(key, encryptedData).apply()
    }
    
    fun getSensitiveData(key: String): String? {
        val encryptedData = encryptedPrefs.getString(key, null)
            ?: return null
        
        val cipher = Cipher.getInstance(
            "${KeyProperties.KEY_ALGORITHM_AES}/ECB/PKCS7Padding"
        )
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey())
        
        val decryptedBytes = cipher.doFinal(
            android.util.Base64.decode(encryptedData, android.util.Base64.NO_WRAP)
        )
        
        return String(decryptedBytes, Charsets.UTF_8)
    }
    
    private fun getOrCreateSecretKey(): SecretKey {
        val existingKey = keyStore.getEntry("my_secret_key", null) as? KeyStore.SecretKeyEntry
        return existingKey?.secretKey ?: createSecretKey()
    }
    
    private fun getSecretKey(): SecretKey {
        return (keyStore.getEntry("my_secret_key", null) as KeyStore.SecretKeyEntry).secretKey
    }
    
    private fun createSecretKey(): SecretKey {
        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEYSTORE
        )
        
        val keyGenSpec = KeyGenParameterSpec.Builder(
            "my_secret_key",
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build()
        
        keyGenerator.init(keyGenSpec)
        return keyGenerator.generateKey()
    }
    
    companion object {
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    }
}
```

### Certificate Pinning

```kotlin
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate

class SecureNetworkClient {
    
    private val certificatePinner = CertificatePinner.Builder()
        .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
        .add("api.example.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")
        .build()
    
    private val okHttpClient = OkHttpClient.Builder()
        .certificatePinner(certificatePinner)
        .hostnameVerifier { hostname, session ->
            val certificate = session.peerCertificates.firstOrNull() as? X509Certificate
            certificate?.let { verifyCertificate(it, hostname) } ?: false
        }
        .connectionSpecs(listOf(ConnectionSpec.MODERN_TLS))
        .protocols(listOf(Protocol.HTTP_2, Protocol.HTTP_1_1))
        .addInterceptor { chain ->
            val originalRequest = chain.request()
            
            val requestWithHeaders = originalRequest.newBuilder()
                .header("X-Request-ID", generateSecureId())
                .header("X-Client-Version", BuildConfig.VERSION_NAME)
                .build()
            
            try {
                val response = chain.proceed(requestWithHeaders)
                
                if (response.code == 401 || response.code == 403) {
                    handleUnauthorized(response)
                }
                
                return@addInterceptor response
            } catch (e: SSLPeerUnverifiedException) {
                handleCertificatePinningError(e)
                throw e
            }
        }
        .build()
    
    private fun verifyCertificate(certificate: X509Certificate, hostname: String): Boolean {
        return try {
            certificate.checkValidity()
            
            val pinnedDomains = certificatePinner.pinnedDomains
            val domainConfig = pinnedDomains[hostname] ?: return false
            
            val pins = domainConfig.pins
            val certificatePin = "sha256/${certificate.publicKey.encoded.sha256Hash()}"
            
            pins.any { it.equals(certificatePin, ignoreCase = true) }
        } catch (e: Exception) {
            false
        }
    }
    
    private fun ByteArray.sha256Hash(): String {
        val digest = java.security.MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(this)
        return hash.joinToString("") { "%02x".format(it) }
    }
    
    private fun generateSecureId(): String {
        val bytes = ByteArray(16)
        java.security.SecureRandom().nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
```

## Best Practices

1. **Use Hardware-Backed Keystore**: Store keys in secure hardware when available
2. **Implement Certificate Pinning**: Prevent MITM attacks
3. **Validate SSL Certificates**: Don't ignore certificate errors
4. **Obfuscate Code**: Use ProGuard/R8 and similar tools
5. **Detect Root/Jailbreak**: Warn or block on compromised devices
6. **Use Secure Enclave**: Leverage hardware security features
7. **Implement Certificate Expiration**: Monitor and rotate certificates
8. **Encrypt Sensitive Data**: Don't store plain text credentials
9. **Validate Inputs**: Prevent injection and XSS attacks
10. **Implement Anti-Tampering**: Detect and respond to app modifications
11. **Use Background App Refresh Control**: Limit background network access
12. **Implement Certificate Transparency**: Monitor for rogue certificates

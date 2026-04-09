---
name: mobile-security
description: Security practices and implementations for mobile applications
category: mobile-development
difficulty: advanced
tags: [mobile, security, encryption, authentication]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Mobile Security

## What I Do

I am Mobile Security, the discipline of protecting mobile applications and their data from unauthorized access, tampering, and reverse engineering. I encompass secure coding practices, encryption implementation, authentication mechanisms, secure storage, network security, and platform-specific security features. I address the unique vulnerabilities of mobile environments including rooted/jailbroken devices, insecure data storage, man-in-the-middle attacks, and code injection. I implement platform security features like Keychain on iOS and Keystore on Android. I protect sensitive data at rest and in transit, implement proper authentication flows, and detect tampering indicators. I help developers follow OWASP Mobile Top 10 guidelines and achieve compliance requirements like SOC 2, HIPAA, and PCI-DSS.

## When to Use Me

- Building applications handling sensitive user data
- Financial and healthcare applications
- Enterprise mobility solutions
- Applications requiring authentication and authorization
- Compliance-driven development environments
- Protecting intellectual property in apps
- Securing API communications
- Anti-tampering and fraud prevention
- Biometric authentication integration

## Core Concepts

**Data Encryption**: Protecting data at rest using platform keychain/keystore and secure enclaves.

**Certificate Pinning**: Preventing man-in-the-middle attacks by validating server certificates.

**Root/Jailbreak Detection**: Identifying compromised devices and applying security mitigations.

**Secure Storage**: Platform-specific secure storage mechanisms (Keychain, EncryptedSharedPreferences).

**OAuth 2.0/OpenID Connect**: Secure authentication and authorization protocols.

**Code Obfuscation**: Protecting application logic from reverse engineering.

**Input Validation**: Preventing injection attacks and malicious input processing.

**Runtime Application Self-Protection (RASP)**: Runtime security monitoring and protection.

## Code Examples

### Example 1: Secure Storage Implementation (Android)
```kotlin
// SecurePreferences.kt
import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class SecurePreferences(context: Context) {
    companion object {
        private const val PREFS_NAME = "secure_prefs"
        private const val KEYSTORE_ALIAS = "mobile_app_key"
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val IV_SIZE = 12
        private const val TAG_SIZE = 128
    }
    
    private val masterKey: MasterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .setUserAuthenticationRequired(false)
        .build()
    
    private val encryptedPrefs: SharedPreferences = 
        EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    
    fun putString(key: String, value: String) {
        encryptedPrefs.edit().putString(key, value).apply()
    }
    
    fun getString(key: String, default: String? = null): String? {
        return encryptedPrefs.getString(key, default)
    }
    
    fun putInt(key: String, value: Int) {
        encryptedPrefs.edit().putInt(key, value).apply()
    }
    
    fun getInt(key: String, default: Int = 0): Int {
        return encryptedPrefs.getInt(key, default)
    }
    
    fun putLong(key: String, value: Long) {
        encryptedPrefs.edit().putLong(key, value).apply()
    }
    
    fun getLong(key: String, default: Long = 0L): Long {
        return encryptedPrefs.getLong(key, default)
    }
    
    fun remove(key: String) {
        encryptedPrefs.edit().remove(key).apply()
    }
    
    fun clear() {
        encryptedPrefs.edit().clear().apply()
    }
}

// Encryption Service
class EncryptionService(context: Context) {
    private val keyStore: KeyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply {
        load(null)
    }
    
    init {
        if (!keyStore.containsAlias(KEYSTORE_ALIAS)) {
            generateKey()
        }
    }
    
    private fun generateKey() {
        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEYSTORE
        )
        
        val keyGenSpec = KeyGenParameterSpec.Builder(
            KEYSTORE_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setUserAuthenticationRequired(false)
            .build()
        
        keyGenerator.init(keyGenSpec)
        keyGenerator.generateKey()
    }
    
    private fun getSecretKey(): SecretKey {
        return (keyStore.getEntry(KEYSTORE_ALIAS, null) as KeyStore.SecretKeyEntry).secretKey
    }
    
    fun encrypt(data: String): Pair<ByteArray, ByteArray> {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey())
        
        val iv = cipher.iv
        val encryptedData = cipher.doFinal(data.toByteArray(Charsets.UTF_8))
        
        return Pair(iv, encryptedData)
    }
    
    fun decrypt(iv: ByteArray, encryptedData: ByteArray): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        val spec = GCMParameterSpec(TAG_SIZE, iv)
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), spec)
        
        val decryptedData = cipher.doFinal(encryptedData)
        return String(decryptedData, Charsets.UTF_8)
    }
    
    fun encryptBytes(data: ByteArray): Pair<ByteArray, ByteArray> {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey())
        return Pair(cipher.iv, cipher.doFinal(data))
    }
    
    fun decryptBytes(iv: ByteArray, encryptedData: ByteArray): ByteArray {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        val spec = GCMParameterSpec(TAG_SIZE, iv)
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), spec)
        return cipher.doFinal(encryptedData)
    }
}
```

### Example 2: Certificate Pinning (React Native)
```typescript
// certificate-pinning.ts
import axios, { AxiosInstance } from 'axios'
import { Platform } from 'react-native'
import RNFetchBlob from 'rn-fetch-blob'

interface SSLConfig {
  keyHash: string
  certPinning?: string[]
}

class SecureNetworkClient {
  private client: AxiosInstance
  private config: SSLConfig
  
  constructor(config: SSLConfig) {
    this.config = config
    
    this.client = axios.create({
      baseURL: 'https://api.example.com',
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
    })
    
    this.setupCertificatePinning()
    this.setupInterceptors()
  }
  
  private setupCertificatePinning(): void {
    if (Platform.OS === 'ios') {
      this.setupIOSPinning()
    } else {
      this.setupAndroidPinning()
    }
  }
  
  private async setupIOSPinning(): Promise<void> {
    // Load pinned certificates from assets
    const certPath = Platform.OS === 'ios' 
      ? RNFetchBlob.fs.dirs.MainBundlePath 
      : RNFetchBlob.fs.dirs.AssetDirDir
    
    // iOS uses ATS with embedded certificates
    // Configure in Info.plist:
    // <key>NSAppTransportSecurity</key>
    // <dict>
    //   <key>NSExceptionDomains</key>
    //   <dict>
    //     <key>example.com</key>
    //     <dict>
    //       <key>IncludesSubdomains</key>
    //       <true/>
    //       <key>ExceptionRequiresForwardSecrecy</key>
    //       <true/>
    //     </dict>
    //   </dict>
    // </dict>
  }
  
  private setupAndroidPinning(): void {
    // Android uses Network Security Config
    // Create res/xml/network_security_config.xml:
    /*
    <?xml version="1.0" encoding="utf-8"?>
    <network-security-config>
      <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.example.com</domain>
        <pin-set expiration="2025-01-01">
          <pin digest="SHA-256">base64EncodedPublicKeyHash=</pin>
        </pin-set>
      </domain-config>
    </network-security-config>
    */
  }
  
  private setupInterceptors(): void {
    // Request interceptor for adding auth headers
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add security headers
        config.headers['X-Client-Version'] = '1.0.0'
        config.headers['X-Platform'] = Platform.OS
        
        return config
      },
      (error) => Promise.reject(error)
    )
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired - attempt refresh
          try {
            await this.refreshAccessToken()
            // Retry original request
            return this.client.request(error.config)
          } catch (refreshError) {
            // Force logout
            await this.handleLogout()
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )
  }
  
  private async refreshAccessToken(): Promise<void> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken')
    
    const response = await axios.post('https://api.example.com/auth/refresh', {
      refresh_token: refreshToken
    })
    
    const { access_token, refresh_token } = response.data
    await SecureStore.setItemAsync('accessToken', access_token)
    await SecureStore.setItemAsync('refreshToken', refresh_token)
  }
  
  private async handleLogout(): Promise<void> {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    // Navigate to login screen
  }
  
  async get<T>(url: string, params?: object): Promise<T> {
    const response = await this.client.get<T>(url, { params })
    return response.data
  }
  
  async post<T>(url: string, data?: object): Promise<T> {
    const response = await this.client.post<T>(url, data)
    return response.data
  }
  
  async put<T>(url: string, data?: object): Promise<T> {
    const response = await this.client.put<T>(url, data)
    return response.data
  }
  
  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url)
    return response.data
  }
}
```

### Example 3: Root/Jailbreak Detection
```typescript
// security-check.ts
import { Platform } from 'react-native'
import RNFetchBlob from 'rn-fetch-blob'
import fs from 'react-native-fs'

interface SecurityCheck {
  isRooted: boolean
  isJailbroken: boolean
  isEmulator: boolean
  isDebuggerAttached: boolean
  isTampered: boolean
  threatLevel: 'low' | 'medium' | 'high'
}

class SecurityChecker {
  async performSecurityCheck(): Promise<SecurityCheck> {
    const [
      isRooted,
      isJailbroken,
      isEmulator,
      isDebuggerAttached,
      isTampered
    ] = await Promise.all([
      this.checkRooting(),
      this.checkJailbreak(),
      this.checkEmulator(),
      this.checkDebugger(),
      this.checkTampering()
    ])
    
    const threatLevel = this.calculateThreatLevel({
      isRooted,
      isJailbroken,
      isEmulator,
      isDebuggerAttached,
      isTampered
    })
    
    return {
      isRooted,
      isJailbroken,
      isEmulator,
      isDebuggerAttached,
      isTampered,
      threatLevel
    }
  }
  
  private async checkRooting(): Promise<boolean> {
    if (Platform.OS !== 'android') return false
    
    // Check for root access binaries
    const rootPaths = [
      '/system/bin/su',
      '/system/xbin/su',
      '/sbin/su',
      '/data/local/xbin/su',
      '/data/local/bin/su',
      '/system/app/Superuser.apk',
      '/system/app/SuperSU.apk',
      '/system/bin/failsafe/su'
    ]
    
    for (const path of rootPaths) {
      try {
        const exists = await this.fileExists(path)
        if (exists) return true
      } catch {
        continue
      }
    }
    
    // Check for root management apps
    const rootApps = [
      'com.noshufu.android.customizersa',
      'com.koushikdutta.superuser',
      'com.chainfire.supersu',
      'com.topjohnwu.magisk'
    ]
    
    for (const packageName of rootApps) {
      if (await this.isPackageInstalled(packageName)) {
        return true
      }
    }
    
    return false
  }
  
  private async checkJailbreak(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false
    
    const jailbreakPaths = [
      '/Applications/Cydia.app',
      '/Library/MobileSubstrate/MobileSubstrate.dylib',
      '/bin/bash',
      '/usr/sbin/sshd',
      '/etc/apt',
      '/private/var/lib/apt'
    ]
    
    for (const path of jailbreakPaths) {
      try {
        const exists = await this.fileExists(path)
        if (exists) return true
      } catch {
        continue
      }
    }
    
    // Check for jailbreak detection bypass tools
    const bypassTools = [
      'com.iOSOnDevice.Anti',
      'com.jailbreak.anch0r',
      'libhooker'
    ]
    
    for (const packageName of bypassTools) {
      if (await this.isPackageInstalled(packageName)) {
        return true
      }
    }
    
    return false
  }
  
  private async checkEmulator(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const emulatorIndicators = [
        'ro.kernel.qemu',
        'ro.hardware',
        'generic',
        'sdk'
      ]
      
      for (const indicator of emulatorIndicators) {
        const value = await this.getSystemProperty(indicator)
        if (value?.includes(indicator)) return true
      }
    }
    
    if (Platform.OS === 'ios') {
      const simulator = await this.getDeviceModel()
      if (simulator.includes('Simulator')) return true
    }
    
    return false
  }
  
  private async checkDebugger(): Promise<boolean> {
    // Check global flags
    const global = globalThis as any
    if (global.__DEV__ === false) return false
    
    // Check for debugger attached
    // @ts-ignore
    if (typeof DdTracker !== 'undefined') return true
    
    // Check for debugging libraries
    // Implementation varies by platform
    
    return false
  }
  
  private async checkTampering(): Promise<boolean> {
    // Verify app signature
    const expectedSignature = 'expected_signature_hash'
    const currentSignature = await this.getAppSignature()
    
    if (currentSignature !== expectedSignature) {
      return true
    }
    
    // Check for modified resources
    // Verify checksums of critical files
    
    return false
  }
  
  private calculateThreatLevel(checks: Omit<SecurityCheck, 'threatLevel'>): 
    'low' | 'medium' | 'high' {
    let score = 0
    
    if (checks.isRooted || checks.isJailbroken) score += 3
    if (checks.isTampered) score += 3
    if (checks.isDebuggerAttached) score += 2
    if (checks.isEmulator) score += 1
    
    if (score >= 5) return 'high'
    if (score >= 2) return 'medium'
    return 'low'
  }
  
  private async fileExists(path: string): Promise<boolean> {
    try {
      await RNFetchBlob.fs.exists(path)
      return true
    } catch {
      return false
    }
  }
  
  private async isPackageInstalled(packageName: string): Promise<boolean> {
    // Platform-specific implementation
    return false
  }
  
  private async getSystemProperty(key: string): Promise<string | null> {
    // Android system property access
    return null
  }
  
  private async getAppSignature(): Promise<string> {
    // Platform-specific signature verification
    return ''
  }
  
  private async getDeviceModel(): Promise<string> {
    // Device model detection
    return ''
  }
}
```

### Example 4: Biometric Authentication
```typescript
// biometric-auth.ts
import { Platform } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'

interface BiometricResult {
  success: boolean
  error?: string
  biometricType?: 'face' | 'fingerprint' | 'none'
}

class BiometricService {
  async isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    if (!hasHardware) return false
    
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()
    return isEnrolled
  }
  
  async getBiometricType(): Promise<'face' | 'fingerprint' | 'none'> {
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face'
    }
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint'
    }
    return 'none'
  }
  
  async authenticate(
    reason: string = 'Authenticate to access this feature'
  ): Promise<BiometricResult> {
    const hasBiometrics = await this.isBiometricAvailable()
    
    if (!hasBiometrics) {
      return {
        success: false,
        error: 'Biometric authentication not available',
        biometricType: 'none'
      }
    }
    
    const biometricType = await this.getBiometricType()
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      })
      
      if (result.success) {
        return { success: true, biometricType }
      } else {
        return {
          success: false,
          error: this.getErrorMessage(result.error),
          biometricType
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed',
        biometricType
      }
    }
  }
  
  async authenticateWithTimeout(
    reason: string,
    timeoutMs: number = 30000
  ): Promise<BiometricResult> {
    return Promise.race([
      this.authenticate(reason),
      new Promise<BiometricResult>((resolve) =>
        setTimeout(() => 
          resolve({ success: false, error: 'Authentication timeout' }), 
          timeoutMs
        )
      )
    ])
  }
  
  private getErrorMessage(error?: string): string {
    if (!error) return 'Authentication failed'
    
    if (error.includes('user_cancel')) return 'Authentication cancelled'
    if (error.includes('user_fallback')) return 'User selected fallback'
    if (error.includes('biometry_lockout')) return 'Too many attempts'
    if (error.includes('biometry_not_available')) return 'Biometrics not available'
    if (error.includes('biometry_not_enrolled')) return 'No biometrics enrolled'
    
    return 'Authentication failed'
  }
}

// Usage with secure token storage
class SecureAuthService {
  private biometricService = new BiometricService()
  private secureStorage = new SecureStorage()
  
  async requireBiometricAuth(): Promise<boolean> {
    const result = await this.biometricService.authenticate(
      'Authentication required to access this feature'
    )
    
    if (result.success) {
      // Generate new secure token after successful auth
      const token = this.generateSecureToken()
      await this.secureStorage.storeToken(token)
      return true
    }
    
    return false
  }
  
  private generateSecureToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}
```

### Example 5: Code Obfuscation and Integrity (iOS)
```swift
// Security Configuration - AppDelegate.swift
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Security checks
        SecurityChecker.performSecurityChecks()
        
        // Disable debug logging in release
        #if DEBUG
        // Enable debug features
        #endif
        
        // Configure ATS
        configureAppTransportSecurity()
        
        return true
    }
    
    private func configureAppTransportSecurity() {
        let ats = ATSSettings()
        ats.allowsArbitraryLoads = false
        ats.allowsArbitraryLoadsInWebContent = false
        ats.allowsArbitraryLoadsForMedia = false
    }
}

// SecurityChecker.swift
struct SecurityChecker {
    
    static func performSecurityChecks() {
        // Jailbreak detection
        if isJailbroken() {
            handleJailbrokenDevice()
        }
        
        // Debugger detection
        if isDebuggerAttached() {
            handleDebuggerDetected()
        }
        
        // Emulator detection
        if isRunningOnSimulator() {
            handleSimulatorEnvironment()
        }
    }
    
    private static func isJailbroken() -> Bool {
        #if targetEnvironment(simulator)
        return false
        #else
        let jailbreakPaths = [
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd"
        ]
        
        for path in jailbreakPaths {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }
        
        return false
        #endif
    }
    
    private static func isDebuggerAttached() -> Bool {
        #if DEBUG
        return true
        #else
        var info = kinfo_proc()
        var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
        var size = MemoryLayout<kinfo_proc>.size
        
        sysctl(&mib, 4, &info, &size, nil, 0)
        
        return (info.kp_proc.p_flag & P_TRACED) != 0
        #endif
    }
    
    private static func isRunningOnSimulator() -> Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }
    
    private static func handleJailbrokenDevice() {
        // Options: Block app, show warning, or log analytics
        print("Jailbroken device detected")
        
        // For high-security apps:
        // exit(1)
    }
    
    private static func handleDebuggerDetected() {
        print("Debugger attached")
        
        // For high-security apps:
        // exit(1)
    }
    
    private static func handleSimulatorEnvironment() {
        print("Running on simulator")
    }
}

// Runtime Integrity Checks
class RuntimeIntegrity {
    
    static func verifyMemoryIntegrity() {
        // Check for memory tampering
        let criticalAddresses: [UnsafeRawPointer] = [
            // Critical function pointers
        ]
        
        for address in criticalAddresses {
            let originalValue = loadFromAddress(address)
            if hasTampered(originalValue) {
                handleTamperingDetected()
            }
        }
    }
    
    private static func loadFromAddress(_ address: UnsafeRawPointer) -> UInt {
        return unsafeBitCast(address, to: UnsafePointer<UInt>.self).pointee
    }
    
    private static func hasTampered(_ value: UInt) -> Bool {
        // Compare with known good values
        return false
    }
    
    private static func handleTamperingDetected() {
        // Log and handle security breach
        fatalError("Integrity violation detected")
    }
}
```

## Best Practices

- Never hardcode sensitive data or keys in application code
- Use platform secure storage (Keychain/Keystore) for credentials
- Implement certificate pinning for all API communications
- Validate SSL/TLS certificates and reject invalid connections
- Use biometric authentication for sensitive operations
- Implement root/jailbreak detection for security-sensitive apps
- Obfuscate code using ProGuard/R8 and iOS obfuscation tools
- Use ATS (App Transport Security) to enforce HTTPS
- Validate all inputs to prevent injection attacks
- Implement secure session management with token expiration
- Use code signing and integrity verification
- Monitor for suspicious activity and security events

## Core Competencies

- Platform secure storage (Keychain, Keystore)
- Certificate pinning and SSL/TLS
- Biometric authentication integration
- Root/jailbreak detection
- Code obfuscation and anti-tampering
- Encrypted data storage
- Secure key management
- OAuth 2.0 and OpenID Connect
- API authentication flows
- Runtime application protection
- Security testing and auditing
- OWASP Mobile Top 10 compliance
- Data encryption at rest and in transit
- Secure session management
- Memory security considerations

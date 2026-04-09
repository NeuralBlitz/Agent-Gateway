# Crypto Skill

Encryption, hashing, and cryptographic operations.

## Commands

### Hash String
```
/crypto hash <string>
```
Generate hash (SHA-256).

### Hash File
```
/crypto hash-file <path>
```
Generate file hash.

### Generate Key
```
/crypto gen-key [bits]
```
Generate encryption key. Default: 256 bits.

### Encrypt
```
/crypto encrypt <plaintext> <key>
```
Encrypt with AES.

### Decrypt
```
/crypto decrypt <ciphertext> <key>
```
Decrypt with AES.

### Generate Password
```
/crypto password [length]
```
Generate random password.

### UUID
```
/crypto uuid
```
Generate UUID.

### Base64 Encode
```
/crypto base64-encode <string>
```
Encode to Base64.

### Base64 Decode
```
/crypto base64-decode <string>
```
Decode from Base64.

### HMAC
```
/crypto hmac <message> <key>
```
Generate HMAC.

### Random
```
/crypto random [length]
```
Generate random bytes.

## Examples

```
/crypto hash "hello world"
/crypto hash-file secret.zip
/crypto gen-key
/crypto encrypt "secret" mykey123
/crypto decrypt U2FsdGVkX... mykey123
/crypto password 16
/crypto uuid
/crypto base64-encode "test"
/crypto hmac "message" "secret"
/crypto random 32
```

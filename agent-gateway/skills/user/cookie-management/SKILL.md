# Cookie Management

## Overview

Cookie Management encompasses the practices and techniques for creating, storing, reading, and managing HTTP cookies in web applications. This includes session management, authentication tokens, tracking, preferences, and ensuring proper security practices like HttpOnly, Secure, and SameSite flags.

## Description

Cookies are small pieces of data stored in the browser and sent with each HTTP request. Cookie management involves creating cookies with appropriate attributes, handling cookie-based authentication and sessions, managing cookie consent, implementing secure cookie practices, and handling cookie-related compliance requirements (GDPR, CCPA).

## Prerequisites

- HTTP protocol knowledge
- Browser storage mechanisms
- Web security concepts
- Session management patterns
- Privacy regulations understanding

## Core Competencies

- Cookie creation and configuration
- Session management
- Secure cookie flags
- Cookie signing and encryption
- Cookie consent management
- Third-party cookie handling
- Cookie-based authentication
- Browser compatibility

## Implementation

```python
import hashlib
import hmac
import base64
import json
import time
import uuid
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import logging
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

class SameSite(Enum):
    STRICT = "Strict"
    LAX = "Lax"
    NONE = "None"

@dataclass
class CookieConfig:
    name: str
    value: str = ""
    max_age: Optional[int] = None
    expires: Optional[datetime] = None
    domain: Optional[str] = None
    path: str = "/"
    secure: bool = True
    http_only: bool = True
    same_site: SameSite = SameSite.LAX
    partitioned: bool = False

@dataclass
class Cookie:
    name: str
    value: str
    attributes: Dict[str, Any] = field(default_factory=dict)

    def to_header(self) -> str:
        parts = [f"{self.name}={self.value}"]

        if "max_age" in self.attributes:
            parts.append(f"Max-Age={self.attributes['max_age']}")
        if "expires" in self.attributes:
            parts.append(f"Expires={self.attributes['expires']}")
        if "domain" in self.attributes:
            parts.append(f"Domain={self.attributes['domain']}")
        if "path" in self.attributes:
            parts.append(f"Path={self.attributes['path']}")
        if self.attributes.get("secure"):
            parts.append("Secure")
        if self.attributes.get("http_only"):
            parts.append("HttpOnly")
        if "same_site" in self.attributes:
            parts.append(f"SameSite={self.attributes['same_site'].value}")

        return "; ".join(parts)

class CookieJar:
    def __init__(self, secret_key: str = None):
        self.cookies: Dict[str, Cookie] = {}
        self.secret_key = secret_key.encode() if secret_key else None
        if secret_key:
            self.cipher = Fernet(secret_key.encode())

    def set_cookie(self, config: CookieConfig):
        value = config.value

        if self.secret_key and config.http_only:
            value = self._sign_cookie(value)

        cookie = Cookie(
            name=config.name,
            value=value,
            attributes={
                "max_age": config.max_age,
                "expires": config.expires.isoformat() if config.expires else None,
                "domain": config.domain,
                "path": config.path,
                "secure": config.secure,
                "http_only": config.http_only,
                "same_site": config.same_site,
            }
        )
        self.cookies[config.name] = cookie

    def get_cookie(self, name: str) -> Optional[Cookie]:
        return self.cookies.get(name)

    def get_value(self, name: str, verify: bool = True) -> Optional[str]:
        cookie = self.cookies.get(name)
        if not cookie:
            return None

        if verify and self.secret_key and cookie.attributes.get("http_only"):
            return self._verify_signature(cookie.value)

        return cookie.value

    def delete_cookie(self, name: str, domain: str = None, path: str = "/"):
        if name in self.cookies:
            del self.cookies[name]

        expired = Cookie(
            name=name,
            value="",
            attributes={
                "max_age": 0,
                "expires": datetime(1970, 1, 1).isoformat(),
                "domain": domain,
                "path": path,
                "secure": True,
                "http_only": False,
            }
        )
        self.cookies[name] = expired

    def _sign_cookie(self, value: str) -> str:
        timestamp = str(int(time.time()))
        data = f"{value}.{timestamp}"
        signature = hmac.new(self.secret_key, data.encode(), hashlib.sha256).hexdigest()
        return base64.urlsafe_b64encode(f"{data}.{signature}".encode()).decode()

    def _verify_signature(self, signed_value: str) -> str:
        try:
            decoded = base64.urlsafe_b64decode(signed_value.encode()).decode()
            parts = decoded.rsplit(".", 3)
            if len(parts) != 4:
                return None

            value, timestamp, signature = parts[0], parts[1], parts[2]
            expected_sig = hmac.new(self.secret_key, f"{value}.{timestamp}".encode(), hashlib.sha256).hexdigest()

            if not hmac.compare_digest(signature, expected_sig):
                return None

            if time.time() - int(timestamp) > 86400:
                return None

            return value

        except Exception as e:
            logger.error(f"Cookie verification failed: {e}")
            return None

class SessionManager:
    def __init__(self, cookie_name: str = "session_id", secret_key: str = None):
        self.cookie_name = cookie_name
        self.sessions: Dict[str, Dict] = {}
        self.secret_key = secret_key.encode() if secret_key else None
        self.session_timeout = 3600
        self.cookie_config = CookieConfig(
            name=cookie_name,
            path="/",
            secure=True,
            http_only=True,
            same_site=SameSite.LAX
        )

    def create_session(self, data: Dict[str, Any], cookie_jar: CookieJar = None) -> str:
        session_id = str(uuid.uuid4())
        expiry = time.time() + self.session_timeout

        self.sessions[session_id] = {
            "data": data,
            "created_at": time.time(),
            "expires_at": expiry,
            "accessed_at": time.time()
        }

        if cookie_jar:
            config = CookieConfig(
                name=self.cookie_name,
                value=session_id,
                max_age=self.session_timeout,
                path="/",
                secure=True,
                http_only=True,
                same_site=SameSite.LAX
            )
            cookie_jar.set_cookie(config)

        return session_id

    def get_session(self, session_id: str) -> Optional[Dict]:
        if session_id not in self.sessions:
            return None

        session = self.sessions[session_id]
        if time.time() > session["expires_at"]:
            del self.sessions[session_id]
            return None

        session["accessed_at"] = time.time()
        return session

    def update_session(self, session_id: str, data: Dict[str, Any]) -> bool:
        if session_id not in self.sessions:
            return False

        self.sessions[session_id]["data"] = data
        self.sessions[session_id]["expires_at"] = time.time() + self.session_timeout
        return True

    def delete_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]

    def cleanup_expired(self):
        now = time.time()
        expired = [sid for sid, s in self.sessions.items() if s["expires_at"] < now]
        for sid in expired:
            del self.sessions[sid]

class CookieConsentManager:
    def __init__(self):
        self.consent_types = ["essential", "analytics", "marketing", "personalization"]
        self.consent_cookies: Dict[str, Dict] = {}
        self.consent_expiry = 365 * 24 * 3600

    def get_consent_banner_html(self) -> str:
        return """
        <div id="cookie-consent-banner" style="position: fixed; bottom: 0; left: 0; right: 0; background: #f5f5f5; padding: 20px; text-align: center;">
            <p>We use cookies to improve your experience. <a href="/privacy">Learn more</a></p>
            <button onclick="acceptAllCookies()">Accept All</button>
            <button onclick="rejectNonEssentialCookies()">Essential Only</button>
            <button onclick="showCookieSettings()">Settings</button>
        </div>
        """

    def set_consent(self, consent: Dict[str, bool], cookie_jar: CookieJar):
        consent_data = {
            "consent": consent,
            "timestamp": time.time(),
            "version": "1.0"
        }
        encoded = base64.urlsafe_b64encode(json.dumps(consent_data).encode()).decode()

        config = CookieConfig(
            name="cookie_consent",
            value=encoded,
            max_age=self.consent_expiry,
            path="/",
            secure=True,
            http_only=False,
            same_site=SameSite.LAX
        )
        cookie_jar.set_cookie(config)
        self.consent_cookies["cookie_consent"] = consent_data

    def get_consent(self, cookie_jar: CookieJar) -> Dict[str, bool]:
        consent_cookie = cookie_jar.get_value("cookie_consent", verify=False)
        if not consent_cookie:
            return {"essential": True, "analytics": False, "marketing": False, "personalization": False}

        try:
            decoded = base64.urlsafe_b64decode(consent_cookie.encode()).decode()
            data = json.loads(decoded)
            return data.get("consent", {})
        except:
            return {"essential": True, "analytics": False, "marketing": False, "personalization": False}

    def is_allowed(self, cookie_type: str, cookie_jar: CookieJar) -> bool:
        consent = self.get_consent(cookie_jar)
        return consent.get(cookie_type, False) or cookie_type == "essential"

class CookieParser:
    @staticmethod
    def parse_cookie_header(header: str) -> Dict[str, str]:
        cookies = {}
        for part in header.split(";"):
            if "=" in part:
                name, value = part.strip().split("=", 1)
                cookies[name.strip()] = value.strip()
        return cookies

    @staticmethod
    def build_set_cookie_header(
        name: str,
        value: str,
        max_age: int = None,
        expires: datetime = None,
        domain: str = None,
        path: str = "/",
        secure: bool = False,
        http_only: bool = False,
        same_site: str = "Lax"
    ) -> str:
        parts = [f"{name}={value}"]

        if max_age is not None:
            parts.append(f"Max-Age={max_age}")
        if expires:
            parts.append(f"Expires={expires.strftime('%a, %d %b %Y %H:%M:%S GMT')}")
        if domain:
            parts.append(f"Domain={domain}")
        if path:
            parts.append(f"Path={path}")
        if secure:
            parts.append("Secure")
        if http_only:
            parts.append("HttpOnly")
        parts.append(f"SameSite={same_site}")

        return "; ".join(parts)
```

## Use Cases

- Session management and authentication
- User preference storage
- Tracking and analytics
- Shopping cart persistence
- Cookie consent compliance
- CSRF token management
- JWT token storage

## Artifacts

- `CookieConfig`: Cookie configuration
- `CookieJar`: Cookie storage
- `SessionManager`: Session handling
- `CookieConsentManager`: Consent management
- `CookieParser`: Header parsing

## Related Skills

- Session Management
- Web Security
- Authentication
- Privacy Compliance
- HTTP Protocol
- CSRF Protection

---
name: CDN
description: Content Delivery Network configuration and optimization
license: MIT
compatibility: Cloud providers (Cloudflare, AWS CloudFront, Fastly, Akamai)
audience: DevOps engineers and performance engineers
category: Networking
---

# CDN Configuration

## What I Do

I provide guidance for configuring and optimizing CDN deployments. I cover cache policies, edge computing, SSL/TLS on CDN, origin shielding, and performance optimization.

## When to Use Me

- Setting up CDN for static assets
- Configuring cache rules
- Implementing edge computing
- Optimizing CDN performance
- Managing multiple origins

## Core Concepts

- **Cache-Control Headers**: Browser and CDN caching
- **Edge Locations**: Global points of presence
- **Origin Shielding**: Protecting origin servers
- **Cache Invalidation**: Purging cached content
- **Edge Functions**: Serverless at edge
- **Origin Pull/Push**: Fetching content strategies
- **Compression**: Gzip, Brotli, Zstandard
- **HTTP/2 and HTTP/3**: Modern protocols
- **Geo-Restrictions**: Regional content delivery
- **Load Balancing**: Multiple origin servers

## Code Examples

### CloudFront Distribution Configuration

```yaml
# cloudfront-distribution.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFront Distribution for static hosting'

Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-cdn-origin-bucket
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders:
              - '*'
            AllowedMethods:
              - GET
              - HEAD
            AllowedOrigins:
              - '*'
            MaxAge: 3600

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Action: s3:GetObject
            Effect: Allow
            Principal: '*'
            Resource: !Sub '${S3Bucket.Arn}/*'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: 'Production CDN Distribution'
        Enabled: true
        HttpVersion: http2and3
        IPV6Enabled: true
        DefaultRootObject: index.html
        
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt S3Bucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginShield:
              Enabled: true
              OriginShieldRegion: us-east-1
        
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
            - OPTIONS
          Compress: true
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
            Headers:
              - Origin
              - Access-Control-Request-Method
              - Access-Control-Request-Headers
          DefaultTTL: 86400
          MaxTTL: 31536000
          MinTTL: 0
        
        CacheBehaviors:
          - PathPattern: '/api/*'
            TargetOriginId: APIOrigin
            ViewerProtocolPolicy: https-only
            AllowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - PATCH
            CachedMethods:
              - GET
              - HEAD
            ForwardedValues:
              QueryString: true
              Cookies:
                Forward: all
            DefaultTTL: 0
            MaxTTL: 0
            MinTTL: 0
            
          - PathPattern: '/static/*'
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: https-only
            AllowedMethods:
              - GET
              - HEAD
            Compress: true
            DefaultTTL: 604800
            MaxTTL: 2592000
            MinTTL: 86400
        
        PriceClass: PriceClass_100
        
        CustomErrorResponses:
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 300
        
        Restrictions:
          GeoRestriction:
            RestrictionType: whitelist
            Locations:
              - US
              - CA
              - GB
              - DE
        
        ViewerCertificate:
          MinimumProtocolVersion: TLSv1.2_2021
          SslSupportMethod: sni-only
          CertificateSource: ACM
          ACMCertificateArn: !Ref SSLCertificate

  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: 'cdn.example.com'
      SubjectAlternativeNames:
        - '*.cdn.example.com'
      ValidationMethod: DNS
```

### Edge Function for Cache Invalidation

```javascript
// CloudFront Edge Function (Cloudflare Workers)
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const cacheKey = new Request(url.toString(), request)
  
  const cache = caches.default
  
  if (request.method === 'PURGE') {
    const path = url.searchParams.get('path')
    if (!path) {
      return new Response('Missing path parameter', { status: 400 })
    }
    
    const purgeUrl = new URL(path, request.url)
    const response = await cache.delete(purgeUrl)
    
    return new Response(JSON.stringify({ 
      purged: response,
      path: path 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  if (url.pathname.startsWith('/api/')) {
    const response = await fetch(request)
    
    const newResponse = new Response(response.body, response)
    
    newResponse.headers.set('Cache-Control', 'no-store, private')
    newResponse.headers.set('X-Cache', 'Miss from edge')
    
    return newResponse
  }
  
  let response = await cache.match(cacheKey)
  
  if (!response) {
    response = await fetch(request)
    
    const newResponse = new Response(response.body, response)
    
    const cacheControl = parseCacheControl(response.headers)
    
    if (cacheControl['no-store'] !== true) {
      const cacheOptions = {
        status: response.status,
        headers: new Map(response.headers)
      }
      
      cacheOptions.headers.set('Cache-Control', 
        `public, max-age=${cacheControl['max-age'] || 86400}`)
      cacheOptions.headers.set('X-Cache', 'Hit from edge')
      
      event.waitUntil(cache.put(cacheKey, new Response(
        response.body,
        cacheOptions
      )))
    }
    
    return newResponse
  }
  
  const newResponse = response.clone()
  newResponse.headers.set('X-Cache', 'Hit from edge')
  
  return newResponse
}

function parseCacheControl(headers) {
  const cacheControl = {}
  const value = headers.get('cache-control')
  
  if (value) {
    for (const directive of value.split(',')) {
      const [key, val] = directive.trim().split('=')
      cacheControl[key] = val ? parseInt(val) : true
    }
  }
  
  return cacheControl
}

// A/B Testing Edge Function
async function handleABTest(request) {
  const url = new URL(request.url)
  
  let bucket = request.headers.get('X-AB-Test')
  
  if (!bucket) {
    const buckets = ['variant-a', 'variant-b']
    bucket = buckets[Math.floor(Math.random() * buckets.length)]
  }
  
  const cacheKey = new Request(url.toString(), request)
  const cache = caches.default
  let response = await cache.match(cacheKey)
  
  if (!response) {
    response = await fetch(request)
    
    if (url.pathname.startsWith('/static/')) {
      const newResponse = response.clone()
      
      const newHeaders = new Map(response.headers)
      newHeaders.set('X-AB-Test', bucket)
      newHeaders.set('Cache-Control', 'public, max-age=3600')
      
      event.waitUntil(cache.put(cacheKey, new Response(
        response.body,
        { status: response.status, headers: newHeaders }
      )))
    }
  }
  
  return new Response(response.body, {
    ...response,
    headers: {
      ...Object.fromEntries(response.headers),
      'X-AB-Test': bucket
    }
  })
}
```

### Nginx CDN Configuration

```nginx
# /etc/nginx/conf.d/cdn.conf

proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:100m
                 inactive=7d max_size=10g use_temp_path=off;

upstream origin_servers {
    least_conn;
    
    server 10.0.1.10:8080 weight=5;
    server 10.0.1.11:8080 weight=5;
    server 10.0.1.12:8080 weight=3 backup;
    
    keepalive 32;
}

server {
    listen 80;
    server_name cdn.example.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cdn.example.com;
    
    ssl_certificate /etc/ssl/certs/cdn.example.com.crt;
    ssl_certificate_key /etc/ssl/private/cdn.example.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    
    # Static asset caching
    location /static/ {
        proxy_pass http://origin_servers;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache static_cache;
        proxy_cache_valid 200 7d;
        proxy_cache_valid 404 1m;
        
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
        proxy_cache_lock on;
        
        add_header X-Cache-Status $upstream_cache_status;
        
        expires 7d;
        add_header Cache-Control "public, immutable";
        
        gzip on;
        gzip_types text/plain text/css application/json 
                   application/javascript text/xml application/xml;
    }
    
    # API responses - no caching
    location /api/ {
        proxy_pass http://origin_servers;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
        
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Media files - long cache
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://origin_servers;
        proxy_cache static_cache;
        
        proxy_cache_valid 200 30d;
        proxy_cache_use_stale error timeout updating;
        
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }
    
    # Javascript and CSS
    location ~* \.(js|css)$ {
        proxy_pass http://origin_servers;
        proxy_cache static_cache;
        
        proxy_cache_valid 200 1d;
        
        expires 1d;
        add_header Cache-Control "public, max-age=86400, immutable";
        
        gzip on;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }
    
    # Purge endpoint
    location /purge {
        allow 10.0.0.0/8;
        allow 127.0.0.1;
        deny all;
        
        proxy_cache_purge static_cache $scheme://$host$request_uri;
    }
}
```

## Best Practices

1. **Set Appropriate TTLs**: Match cache duration to content freshness
2. **Implement Cache Invalidation**: Purge mechanisms for updates
3. **Use Compression**: Enable gzip or Brotli
4. **Configure Origin Shielding**: Reduce load on origin servers
5. **Enable HTTP/2 or HTTP/3**: Improved performance
6. **Implement Edge Computing**: Process at edge locations
7. **Monitor Cache Hit Ratio**: Track performance
8. **Use Origin Failover**: Configure backup origins
9. **Configure Geo-Restrictions**: Control content availability
10. **Optimize SSL/TLS**: Use modern protocols and ciphers

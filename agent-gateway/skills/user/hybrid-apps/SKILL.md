---
name: hybrid-apps
description: Hybrid mobile app development
license: MIT
compatibility: opencode
metadata:
  audience: mobile-developers
  category: mobile-development
---

## What I do

- Build hybrid mobile applications using web technologies (HTML, CSS, JavaScript)
- Develop with frameworks like Ionic, Cordova, and Capacitor
- Create Progressive Web Apps (PWAs) with service workers
- Wrap web apps in native containers for app store deployment
- Access native device APIs through plugins
- Implement responsive designs for multiple screen sizes
- Manage hybrid app build pipelines

## When to use me

Use me when:
- Building apps with web development skills
- Porting existing web apps to mobile
- Quick cross-platform deployment needed
- Budget constraints limit native development
- Simple utility or content-focused apps
- Need rapid iteration and deployment

## Key Concepts

### Hybrid Architecture
Hybrid apps run in a WebView but can access native APIs through bridges. They combine web and native components.

```
┌─────────────────────────────────────┐
│           Native Container          │
│  ┌─────────────────────────────┐   │
│  │        WebView (HTML/JS)    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │     Native Bridge/Plugins    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Ionic Framework
Popular hybrid framework using Angular, React, or Vue:

```typescript
import { Component, OnInit } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';

@Component({
  selector: 'app-camera',
  template: `
    <ion-button (click)="takePicture()">Take Photo</ion-button>
    <ion-img [src]="imageUrl"></ion-img>
  `
})
export class CameraPage implements OnInit {
  imageUrl: string;

  constructor(private camera: Camera) {}

  takePicture() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG
    };

    this.camera.getPicture(options).then(
      (imageData) => {
        this.imageUrl = 'data:image/jpeg;base64,' + imageData;
      }
    );
  }
}
```

### Capacitor vs Cordova
- **Capacitor**: Modern successor, better native performance, simpler plugin system
- **Cordova**: Larger plugin ecosystem, mature but legacy

### PWA Features
- Service workers for offline support
- Web App Manifest for installability
- Push notifications
- Background sync

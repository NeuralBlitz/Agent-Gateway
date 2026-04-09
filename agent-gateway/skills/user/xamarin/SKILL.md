---
name: xamarin
description: Xamarin cross-platform development
license: MIT
compatibility: opencode
metadata:
  audience: mobile-developers
  category: mobile-development
---

## What I do

- Build cross-platform mobile apps with C# and .NET
- Develop native iOS and Android apps with Xamarin
- Create Xamarin.Forms for shared UI code
- Implement platform-specific features with Effects and Renderers
- Use .NET libraries and NuGet packages
- Share code across iOS, Android, and Windows
- Integrate with Azure services

## When to use me

Use me when:
- Teams with C#/.NET expertise
- Existing .NET codebase to extend to mobile
- Enterprise apps requiring Azure integration
- Need shared business logic across platforms
- Windows mobile target needed
- Requiring deep native API access

## Key Concepts

### Xamarin Architecture
Xamarin compiles C# to native code, providing full API access:

```
┌─────────────────────────────────────────────┐
│            Shared C# Code                   │
│  (Business Logic, Models, ViewModels)       │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐      ┌───────────────┐
│   Xamarin    │      │    Xamarin    │
│     iOS      │      │   Android    │
│  (AOT/Mono)  │      │   (Mono VM)  │
└───────────────┘      └───────────────┘
```

### Xamarin.Forms
Declarative UI shared across platforms:

```csharp
public class App : Application
{
    public App()
    {
        MainPage = new NavigationPage(new MainPage());
    }
}

public class MainPage : ContentPage
{
    public MainPage()
    {
        var button = new Button { Text = "Click Me" };
        var label = new Label { Text = "Counter: 0" };
        int count = 0;

        button.Clicked += (s, e) =>
        {
            count++;
            label.Text = $"Counter: {count}";
        };

        Content = new StackLayout
        {
            Children = { label, button },
            VerticalOptions = LayoutOptions.Center
        };
    }
}
```

### Platform-Specific Customization
- **Effects**: Lightweight customizations
- **Custom Renderers**: Full native control
- **DependencyService**: Platform-specific implementations

### .NET Integration
- Azure Functions
- Entity Framework Core
- ASP.NET Core backend sharing
- NuGet packages

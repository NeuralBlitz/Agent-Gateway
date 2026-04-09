---
name: react-native
description: React Native mobile framework
license: MIT
compatibility: opencode
metadata:
  audience: mobile-developers
  category: mobile-development
---

## What I do

- Build cross-platform mobile apps with React Native
- Develop using JavaScript/TypeScript with React patterns
- Implement native modules and bridges
- Manage React Native state and navigation
- Optimize app performance
- Work with Expo for rapid development
- Handle platform-specific code

## When to use me

Use me when:
- Building mobile apps with React expertise
- Need to share code between web and mobile
- Rapid prototyping required
- Medium-complexity apps
- Teams familiar with JavaScript/React
- Want native performance with JS developer experience

## Key Concepts

### React Native Architecture
React Native uses a bridge to communicate between JavaScript and native components:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   JavaScript   │ ──── │     Bridge      │ ──── │  Native (iOS)  │
│     Thread     │      │   (Async Msg)   │      │    Thread       │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### React Native Components
```tsx
import React, { useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';

const ItemList: React.FC = () => {
  const [items, setItems] = useState<string[]>([]);

  const addItem = () => {
    setItems([...items, `Item ${items.length + 1}`]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item}</Text>
        )}
      />
      <Button title="Add Item" onPress={addItem} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { padding: 12, fontSize: 16 }
});
```

### State Management
- **useState/useReducer**: Local state
- **Context**: Shared state
- **Redux/Zustand**: Global state
- **React Query**: Server state

### Navigation
- **React Navigation**: Most popular, customizable
- **React Native Navigation**: Native performance

### Expo
Managed workflow with pre-built APIs:
- Camera, Location, Notifications
- Push notifications
- Asset loading
- Over-the-air updates

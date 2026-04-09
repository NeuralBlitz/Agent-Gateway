---
name: React Native
description: Cross-platform mobile framework using React and JavaScript
license: MIT
compatibility: Node.js 18+, React 18+, iOS 13+, Android 8+
audience: Frontend developers building cross-platform mobile applications
category: Mobile Development
---

# React Native Development

## What I Do

I provide guidance for building cross-platform mobile applications using React Native. I cover component development, native modules, navigation, state management, and platform-specific implementations.

## When to Use Me

- Building mobile apps with JavaScript/TypeScript expertise
- Creating apps for both iOS and Android from one codebase
- Integrating React web skills into mobile development
- Implementing native device features via bridges
- Rapid prototyping of mobile applications

## Core Concepts

- **React Components**: Building UI with JSX syntax
- **Native Components**: Platform-specific UI elements
- **Props and State**: Managing component data and rendering
- **Hooks**: useState, useEffect, useContext, useCallback
- **FlatList and ScrollView**: Efficient list rendering
- **Navigation**: React Navigation with stack and tab navigators
- **Native Modules**: Bridging JavaScript to native code
- **Hermes Engine**: JavaScript engine optimized for React Native
- **Metro Bundler**: JavaScript bundler for React Native
- **Fast Refresh**: Hot reloading during development

## Code Examples

### Functional Component with Hooks

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface CounterProps {
  initialValue?: number;
  onIncrement?: (value: number) => void;
}

const Counter: React.FC<CounterProps> = ({ 
  initialValue = 0, 
  onIncrement 
}) => {
  const [count, setCount] = useState(initialValue);
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    const newValue = count + 1;
    setCount(newValue);
    onIncrement?.(newValue);
  }, [count, onIncrement]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Count: {count}</Text>
      <Pressable
        style={[styles.button, isPressed && styles.buttonPressed]}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>Increment</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonPressed: {
    backgroundColor: '#0056B3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Counter;
```

### FlatList with Pull-to-Refresh

```tsx
import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, Image, RefreshControl } from 'react-native';

interface User {
  id: string;
  name: string;
  avatar: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    const response = await fetch('https://api.example.com/users');
    const data = await response.json();
    setUsers(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <Text style={styles.userName}>{item.name}</Text>
    </View>
  );

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default UserList;
```

### Navigation Setup

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Details" component={DetailsScreen} />
  </Stack.Navigator>
);

const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{ headerShown: false }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
```

## Best Practices

1. **Use TypeScript**: Type safety improves development experience
2. **Optimize List Rendering**: Use FlatList with proper key extraction
3. **Avoid Anonymous Functions**: Memoize callbacks to prevent re-renders
4. **Use React.memo**: Prevent unnecessary re-renders of pure components
5. **Implement Proper Loading States**: Show skeletons or loading indicators
6. **Handle Platform Differences**: Use Platform.select or conditional imports
7. **Test on Both Platforms**: iOS and Android may behave differently
8. **Use Expo for Fast Development**: Simplifies setup and native dependencies
9. **Optimize Bundle Size**: Remove unused dependencies and use code splitting
10. **Follow Platform Conventions**: iOS and Android have different UX expectations

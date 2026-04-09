---
name: react-native
description: Cross-platform mobile framework using React and JavaScript
tags: [react-native, javascript, typescript, react, mobile, cross-platform]
---

# React Native Development

## What I do

I provide guidance for building cross-platform mobile applications using React Native. I cover JavaScript and TypeScript development, React Native CLI and Expo, component-based UI development, native module integration, and deployment to iOS and Android platforms.

## When to use me

Use me when building cross-platform mobile apps with a single JavaScript codebase, leveraging React expertise for mobile development, integrating with existing web codebases, or developing apps that need both iOS and Android support with shared business logic.

## Core Concepts

React Native component hierarchy and rendering to native views. JSX syntax for component definition. Props and state management with useState, useReducer, and Context API. React Native navigation with React Navigation (stack, tab, and drawer navigators). Native module integration for platform-specific functionality. FlatList and SectionList for efficient list rendering. StyleSheet for component styling with Flexbox layout.

## Code Examples

React Native component with hooks:

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface User {
  id: string;
  name: string;
  email: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.example.com/users?page=${page}`
      );
      const data = await response.json();
      setUsers(prev => [...prev, ...data.users]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.email}>{item.email}</Text>
    </TouchableOpacity>
  );

  const loadMore = () => {
    setPage(p => p + 1);
    setLoading(true);
  };

  return (
    <FlatList
      data={users}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? <ActivityIndicator size="large" /> : null
      }
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  name: { fontSize: 16, fontWeight: '600' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
});

export default UserList;
```

Custom hook for data fetching:

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export default useFetch;
```

## Best Practices

Choose Expo for rapid development or React Native CLI for bare workflow with native code needs. Use TypeScript for type safety and better IDE support. Separate concerns with custom hooks for reusable logic. Optimize list performance with FlatList virtualization and proper key usage. Implement proper error boundaries for graceful error handling. Use React Navigation for declarative navigation patterns. Test components with React Native Testing Library.

## Common Patterns

Custom hooks for extracting and reusing component logic. Context API for global state like themes and authentication. Render props pattern for flexible component APIs. Higher-order components for cross-cutting concerns (though hooks are preferred). Container/Presentational pattern separating UI from business logic. Compound components pattern for related components (like Accordion or Tabs).

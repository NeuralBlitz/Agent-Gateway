---
name: javascript
description: JavaScript and TypeScript best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming
---
## What I do
- Write modern JavaScript (ES6+) with async/await
- Use TypeScript for type safety
- Handle promises and async operations properly
- Use proper error handling with try/catch
- Follow React hooks patterns
- Use destructuring and spread operators
- Avoid var, use const and let
- Use strict equality (===) always

## When to use me
When writing JavaScript or TypeScript code, especially React components.

## Async/Await
```typescript
async function fetchUserData(userId: string): Promise<UserData> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

// Parallel execution
async function fetchMultiple(ids: string[]): Promise<UserData[]> {
  return Promise.all(ids.map(id => fetchUserData(id)));
}
```

## React Hooks
```typescript
interface UseUserOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

function useUser(userId: string | null, options: UseUserOptions = {}): {
  user: UserData | null;
  loading: boolean;
  error: Error | null;
} {
  const { autoRefresh = true, refreshInterval = 5000 } = options;
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await fetchUserData(userId);
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    if (autoRefresh) {
      const interval = setInterval(fetchUser, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [userId, autoRefresh, refreshInterval]);

  return { user, loading, error };
}
```

## TypeScript Interfaces
```typescript
interface APIResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: ('admin' | 'user' | 'guest')[];
  metadata?: {
    createdAt: string;
    lastLogin?: string;
  };
}
```

## Best Practices
- Use arrow functions for callbacks
- Use optional chaining (?.) and nullish coalescing (??)
- Use template literals for string interpolation
- Avoid any, use unknown for truly unknown types
- Use map and filter instead of for loops
- Use Set for unique collections
- Use for...of for iteration, for...in for object keys
- Prefer composition over inheritance

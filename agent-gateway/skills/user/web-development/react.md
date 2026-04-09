---
name: react
description: React development best practices and patterns
category: web-development
---

# React

## What I Do

React is a JavaScript library for building user interfaces, developed by Facebook. I enable developers to create reusable UI components and build complex applications through a component-based architecture. I use a virtual DOM to optimize rendering performance, making dynamic updates efficient even for large applications. React follows a declarative paradigm where you describe what the UI should look like, and React handles the actual DOM manipulation.

I excel at building single-page applications (SPAs), progressive web apps (PWAs), and complex dashboards. My unidirectional data flow makes debugging easier, and my rich ecosystem includes tools for routing, state management, and testing. React Native extends these concepts to mobile development, allowing code sharing between web and native applications.

## When to Use Me

Choose React when building interactive user interfaces with frequent state changes, single-page applications requiring smooth user experiences, complex dashboards with real-time data updates, or when you need a large ecosystem of third-party libraries and tools. React is ideal for teams familiar with JavaScript who want a flexible framework without enforcing strict architectural patterns. Avoid React for simple static websites where a static site generator would be more appropriate, or for applications where bundle size is critical and you need minimal dependencies.

## Core Concepts

React applications are built using components, which are reusable, self-contained pieces of UI. Components can be class-based or functional, with functional components using hooks to manage state and side effects. The virtual DOM is an in-memory representation of the actual DOM that React uses to determine the most efficient way to update the real DOM. JSX is a syntax extension that allows writing HTML-like code in JavaScript files, which gets transpiled to JavaScript function calls.

State management in React uses the useState hook for local component state and context or external libraries like Redux for global state. Effects handle side effects through the useEffect hook, running code after rendering. The useMemo and useCallback hooks optimize performance by memoizing expensive calculations and functions. React Router handles client-side navigation, while React Query or SWR simplify server state management with caching and synchronization.

## Code Examples

```jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function UserCard({ user, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
    onSelect(user.id);
  }, [user.id, onSelect]);
  
  const userInitials = useMemo(() => {
    return user.name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }, [user.name]);
  
  return (
    <div className="user-card" onClick={handleToggle}>
      <div className="avatar">{userInitials}</div>
      <div className="info">
        <h3>{user.name}</h3>
        {isExpanded && <p>{user.email}</p>}
      </div>
    </div>
  );
}

function UserList({ users }) {
  const [selectedId, setSelectedId] = useState(null);
  
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);
  
  const selectedUser = useMemo(() => 
    users.find(u => u.id === selectedId),
    [users, selectedId]
  );
  
  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onSelect={handleSelect}
        />
      ))}
      {selectedUser && (
        <div className="selected-panel">
          Selected: {selectedUser.name}
        </div>
      )}
    </div>
  );
}

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Welcome</h1>} />
        <Route path="/users" element={<UserList users={users} />} />
      </Routes>
    </Router>
  );
}

export default App;
```

```jsx
import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

const initialState = { count: 0, users: [] };

function appReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    default:
      return state;
  }
}

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}

function Counter() {
  const { state, dispatch } = useAppState();
  
  return (
    <div className="counter">
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>
        Increment
      </button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>
        Decrement
      </button>
    </div>
  );
}
```

## Best Practices

Structure your React projects with a clear folder organization separating components by feature or type. Use functional components with hooks instead of class components for better readability and performance. Keep components small and focused on a single responsibility, extracting reusable logic into custom hooks. Use TypeScript or PropTypes for type safety, and implement proper error boundaries to catch rendering errors. Optimize performance with React.memo for component memoization, useMemo for expensive calculations, and useCallback for stable function references.

Implement proper loading and error states for async operations, and use React.lazy with Suspense for code splitting. Write meaningful test cases with React Testing Library, testing behavior rather than implementation details. Use the useEffect cleanup function to prevent memory leaks from subscriptions and timers. Avoid direct DOM manipulation outside of refs, and prefer declarative patterns over imperative code.

## Common Patterns

The compound component pattern creates related components that share state implicitly, useful for tabs, selects, and modals. The render props pattern shares code between components using a prop whose value is a function. The higher-order component pattern wraps components to add additional functionality, useful for cross-cutting concerns like authentication. The custom hook pattern extracts component logic into reusable functions, promoting code reuse and separation of concerns.

The controlled component pattern manages form state entirely in React rather than the DOM, providing full control over inputs. The uncontrolled component pattern uses refs to access DOM values directly, useful for simple forms. The context module pattern combines context with reducers for predictable state management. The provider pattern uses React context to inject dependencies into the component tree, common for theming, internationalization, and feature flags.

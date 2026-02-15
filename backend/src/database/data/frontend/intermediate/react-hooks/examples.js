// ============================================================================
// React Hooks Deep Dive — Code Examples
// ============================================================================

const examples = {
  'usestate-useeffect': [
    {
      title: "useLocalStorage Custom Hook",
      description: "Combines useState and useEffect for persistent state.",
      language: "javascript",
      code: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// Usage
function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  return <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme}</button>;
}`,
      explanation: "This custom hook demonstrates lazy initialization, effect cleanup tracking, and encapsulation — the consumer uses it exactly like useState.",
      order_index: 1,
    },
  ],
  'useref-usememo-usecallback': [
    {
      title: "Search with Debounced Callback",
      description: "Combining useCallback and useRef for a debounced search.",
      language: "javascript",
      code: `import { useState, useCallback, useRef, useEffect } from 'react';

function useDebounce(callback, delay) {
  const timerRef = useRef(null);

  const debouncedFn = useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return debouncedFn;
}

function Search({ onSearch }) {
  const [query, setQuery] = useState('');
  const debouncedSearch = useDebounce(onSearch, 300);

  const handleChange = (e) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  return <input value={query} onChange={handleChange} placeholder="Search..." />;
}`,
      explanation: "useRef holds the timer ID across renders. useCallback ensures the debounced function stays stable. The cleanup in useEffect prevents memory leaks.",
      order_index: 1,
    },
  ],
  'usereducer-usecontext': [
    {
      title: "Complete Auth Context with useReducer",
      description: "Production-ready auth state management.",
      language: "javascript",
      code: `import { createContext, useContext, useReducer, useCallback } from 'react';

const AuthContext = createContext(null);

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true, error: null };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    case 'ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null, isAuthenticated: false, error: null,
  });

  const login = useCallback(async (credentials) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const user = await res.json();
      dispatch({ type: 'LOGIN', payload: user });
    } catch (err) {
      dispatch({ type: 'ERROR', payload: err.message });
    }
  }, []);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};`,
      explanation: "This pattern encapsulates all auth logic in one provider. Child components just call useAuth() to read state or trigger login/logout.",
      order_index: 1,
    },
  ],
};

export default examples;

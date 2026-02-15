// ============================================================================
// TypeScript with React — Code Examples
// ============================================================================

const examples = {
  'typing-components-hooks': [
    {
      title: "Typed Custom Hook — useFetch",
      description: "A generic data fetching hook with full type safety.",
      language: "typescript",
      code: `import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        const data: T = await res.json();
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (err) {
        if (!cancelled) setState({ data: null, loading: false, error: (err as Error).message });
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [url]);

  return state;
}

// Usage
interface User { id: number; name: string; email: string; }

function UserList() {
  const { data: users, loading, error } = useFetch<User[]>('/api/users');
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <ul>{users?.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}`,
      explanation: "The generic <T> flows from useFetch<User[]> through the state type to the returned data — full type safety without any casts.",
      order_index: 1,
    },
  ],
};

export default examples;

// ============================================================================
// Advanced React Patterns — Code Examples
// ============================================================================

const examples = {
  'hoc-render-props': [
    {
      title: "HOC vs Hook Comparison",
      description: "Same feature implemented both ways.",
      language: "javascript",
      code: `// HOC approach
function withWindowSize(WrappedComponent) {
  return function(props) {
    const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

    useEffect(() => {
      const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    }, []);

    return <WrappedComponent {...props} windowSize={size} />;
  };
}

// Custom hook approach (preferred)
function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}

// Usage is cleaner with hooks
function ResponsiveLayout() {
  const { w } = useWindowSize();
  return w > 768 ? <DesktopView /> : <MobileView />;
}`,
      explanation: "Custom hooks achieve the same code reuse without wrapper gymnastics. The hook approach is more composable and easier to debug.",
      order_index: 1,
    },
  ],
  'compound-headless': [
    {
      title: "Compound Tabs Component",
      description: "Full compound component implementation for a tab system.",
      language: "javascript",
      code: `import { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

function Tabs({ children, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabList({ children }) {
  return <div className="tab-list" role="tablist">{children}</div>;
};

Tabs.Tab = function Tab({ value, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      className={\`tab \${activeTab === value ? 'active' : ''}\`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function TabPanel({ value, children }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <div role="tabpanel" className="tab-panel">{children}</div>;
};

// Usage
function App() {
  return (
    <Tabs defaultTab="code">
      <Tabs.List>
        <Tabs.Tab value="code">Code</Tabs.Tab>
        <Tabs.Tab value="preview">Preview</Tabs.Tab>
        <Tabs.Tab value="tests">Tests</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="code"><CodeEditor /></Tabs.Panel>
      <Tabs.Panel value="preview"><Preview /></Tabs.Panel>
      <Tabs.Panel value="tests"><TestRunner /></Tabs.Panel>
    </Tabs>
  );
}`,
      explanation: "Each sub-component accesses shared state via context. The consumer has full control over layout and styling while the component handles state logic.",
      order_index: 1,
    },
  ],
};

export default examples;

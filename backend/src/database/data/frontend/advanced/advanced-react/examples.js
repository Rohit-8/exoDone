// ============================================================================
// Advanced React Patterns — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  "hoc-render-props": [
    {
      title: "withAuth HOC with Ref Forwarding and Static Methods",
      description:
        "A production-quality authentication HOC that handles loading states, role-based access, redirect-after-login, ref forwarding via React.forwardRef, displayName preservation, and static method hoisting — demonstrating all HOC best practices and pitfalls in one example.",
      language: "javascript",
      code: `import React, { forwardRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { useAuth } from '../hooks/useAuth';

// ── HOC Factory: withAuth ──────────────────────────────────────────────────
// Takes a component and optional config, returns an authenticated version.
// Handles: loading, unauthenticated redirect, role check, ref forwarding.

function withAuth(WrappedComponent, { requiredRole = null, redirectTo = '/login' } = {}) {

  // 1. Use forwardRef so refs pass through to WrappedComponent
  const AuthenticatedComponent = forwardRef(function AuthenticatedComponent(props, ref) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // ── Loading state ──
    if (isLoading) {
      return (
        <div className="auth-loading" role="status" aria-label="Checking authentication">
          <div className="spinner" />
          <span className="sr-only">Verifying credentials...</span>
        </div>
      );
    }

    // ── Not authenticated → redirect with return URL ──
    if (!isAuthenticated) {
      return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
    }

    // ── Role check ──
    if (requiredRole && user.role !== requiredRole) {
      return (
        <div className="forbidden" role="alert">
          <h2>403 — Forbidden</h2>
          <p>
            You need the <strong>{requiredRole}</strong> role to access this page.
            Your current role is <strong>{user.role}</strong>.
          </p>
        </div>
      );
    }

    // ── Authorized — render the wrapped component with user injected ──
    return <WrappedComponent {...props} ref={ref} user={user} />;
  });

  // 2. Set displayName for React DevTools debugging
  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  AuthenticatedComponent.displayName = \`withAuth(\${wrappedName})\`;

  // 3. Copy static methods from WrappedComponent to AuthenticatedComponent
  //    Without this, WrappedComponent.fetchData (for SSR) would be lost.
  hoistNonReactStatics(AuthenticatedComponent, WrappedComponent);

  return AuthenticatedComponent;
}

// ── Usage ──────────────────────────────────────────────────────────────────

// Page component with a static method (e.g., for server-side data fetching)
function AdminDashboard({ user }, ref) {
  return (
    <div ref={ref}>
      <h1>Welcome, {user.name}</h1>
      <p>Role: {user.role}</p>
    </div>
  );
}
AdminDashboard.fetchData = async (store) => {
  await store.dispatch(loadDashboardData());
};

// Wrap with HOC — static methods and ref are preserved
const ProtectedAdmin = withAuth(AdminDashboard, { requiredRole: 'admin' });

// In router:
// <Route path="/admin" element={<ProtectedAdmin />} />
//
// ProtectedAdmin.fetchData  → still accessible (hoisted)
// ref={myRef}               → forwards to the inner <div> (forwardRef)
// DevTools shows:           → withAuth(AdminDashboard)`,
      explanation:
        "This HOC demonstrates all three critical HOC pitfalls and their solutions: (1) ref forwarding via React.forwardRef — without it, refs attach to the wrapper instead of the inner component; (2) displayName for DevTools debugging — without it, the wrapper shows as 'Anonymous'; (3) static method hoisting via hoist-non-react-statics — without it, static methods like fetchData (used in SSR frameworks) are lost. The HOC also shows proper loading, redirect-with-return-URL, and role-based access control patterns.",
      order_index: 1,
    },
    {
      title: "Render Props Mouse Tracker with Function-as-Children",
      description:
        "A render-props component that tracks mouse position, demonstrating both the named render prop and function-as-children (FaCC) variants, performance optimization with throttling, and the explicit data flow that makes render props superior to HOCs for debugging — while also showing the callback nesting problem that motivates hooks.",
      language: "javascript",
      code: `import { useState, useEffect, useCallback, useRef } from 'react';

// ── Render Props Component: MouseTracker ──────────────────────────────────
// Tracks mouse position and passes it to a render function.
// Supports both 'render' prop and function-as-children patterns.

function MouseTracker({ render, children, throttleMs = 16 }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const lastUpdate = useRef(0);

  // Throttled mouse handler for performance
  const handleMouseMove = useCallback((e) => {
    const now = Date.now();
    if (now - lastUpdate.current < throttleMs) return;
    lastUpdate.current = now;

    setPosition({ x: e.clientX, y: e.clientY });
    setIsActive(true);
  }, [throttleMs]);

  const handleMouseLeave = useCallback(() => {
    setIsActive(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  // Support both render prop and function-as-children
  const renderFn = render || children;

  if (typeof renderFn !== 'function') {
    throw new Error('MouseTracker requires a render prop or function as children');
  }

  return renderFn({ position, isActive });
}

// ── Usage 1: Named render prop ────────────────────────────────────────────
function HeatmapOverlay() {
  return (
    <MouseTracker
      throttleMs={32}
      render={({ position, isActive }) => (
        <div className="heatmap-overlay">
          {isActive && (
            <div
              className="heatmap-dot"
              style={{
                position: 'fixed',
                left: position.x - 25,
                top: position.y - 25,
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,0,0,0.3) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
          )}
          <p>Cursor: ({position.x}, {position.y})</p>
        </div>
      )}
    />
  );
}

// ── Usage 2: Function as children (FaCC) ──────────────────────────────────
function CursorFollower() {
  return (
    <MouseTracker>
      {({ position, isActive }) => (
        <div className="cursor-follower">
          <div
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: isActive ? '#3b82f6' : '#9ca3af',
              transition: 'background-color 0.2s, opacity 0.2s',
              opacity: isActive ? 1 : 0,
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
    </MouseTracker>
  );
}

// ── The nesting problem — multiple render props compose badly ─────────────
function DashboardWithRenderProps() {
  return (
    <MouseTracker>
      {({ position }) => (
        <WindowSize>
          {({ width, height }) => (
            <ScrollPosition>
              {({ scrollY }) => (
                <div>
                  <p>Mouse: ({position.x}, {position.y})</p>
                  <p>Window: {width}x{height}</p>
                  <p>Scroll: {scrollY}px</p>
                </div>
              )}
            </ScrollPosition>
          )}
        </WindowSize>
      )}
    </MouseTracker>
  );
  // ^ This "callback hell" is the primary reason hooks replaced render props
}`,
      explanation:
        "Render props make data flow explicit — you can see exactly where position and isActive come from. The component supports both the named 'render' prop and function-as-children patterns. The throttling optimization shows a real-world concern. The final example demonstrates the 'callback hell' nesting problem: composing multiple render-prop components creates deeply nested JSX that is hard to read and maintain — this is the primary motivation for replacing render props with custom hooks.",
      order_index: 2,
    },
    {
      title: "Custom Hook Replacement — Migrating HOC and Render Props to Hooks",
      description:
        "Side-by-side migration of three cross-cutting concerns (auth, mouse tracking, window size) from HOC and render-prop patterns to custom hooks — demonstrating how hooks achieve the same logic reuse with flat component trees, explicit data flow, and superior composability.",
      language: "javascript",
      code: `import { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';

// ============================================================================
// 1. useAuth — replaces withAuth HOC
// ============================================================================

const AuthContext = React.createContext(null);

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

// Guard hook — replaces the HOC's conditional rendering
function useRequireAuth(requiredRole = null) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, location]);

  const isAuthorized = isAuthenticated && (!requiredRole || user?.role === requiredRole);

  return { user, isLoading, isAuthenticated, isAuthorized };
}

// Usage — no wrapper, no implicit props
function AdminDashboard() {
  const { user, isLoading, isAuthorized } = useRequireAuth('admin');

  if (isLoading) return <Spinner />;
  if (!isAuthorized) return <ForbiddenPage />;

  return <h1>Welcome, {user.name}</h1>;
}


// ============================================================================
// 2. useMousePosition — replaces MouseTracker render prop
// ============================================================================

function useMousePosition({ throttleMs = 16, enabled = true } = {}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const lastUpdate = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleMove = (e) => {
      const now = Date.now();
      if (now - lastUpdate.current < throttleMs) return;
      lastUpdate.current = now;
      setPosition({ x: e.clientX, y: e.clientY });
      setIsActive(true);
    };

    const handleLeave = () => setIsActive(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, [throttleMs, enabled]);

  return { position, isActive };
}


// ============================================================================
// 3. useWindowSize — replaces withWindowSize HOC
// ============================================================================

function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    let rafId;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return size;
}


// ============================================================================
// Composed Usage — FLAT, EXPLICIT, COMPOSABLE
// ============================================================================

function InteractiveDashboard() {
  // All three hooks compose cleanly in one component — no nesting, no wrappers
  const { user, isLoading } = useRequireAuth('admin');
  const { position, isActive } = useMousePosition({ throttleMs: 32 });
  const { width, height } = useWindowSize();

  if (isLoading) return <Spinner />;

  const isMobile = width < 768;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>

      <div className="stats-grid">
        <p>Viewport: {width} × {height} ({isMobile ? 'Mobile' : 'Desktop'})</p>
        {!isMobile && isActive && (
          <p>Cursor: ({position.x}, {position.y})</p>
        )}
      </div>

      {/* Each piece of data has a clear, traceable origin */}
    </div>
  );
}

// Compare this with the HOC version:
//   const Enhanced = withAuth(withWindowSize(withMouseTracker(Dashboard)));
//   // Inside Dashboard: where does props.width come from? props.position?
//   // DevTools: AuthWrapper > WindowSizeWrapper > MouseWrapper > Dashboard
//
// Or the render props version:
//   <Auth>{(user) => <WindowSize>{(size) => <Mouse>{(pos) => ...}</Mouse>}</WindowSize>}</Auth>
//
// Hooks: flat, explicit, no wrappers, no nesting. Clear winner.`,
      explanation:
        "This example shows a complete migration from HOCs and render props to custom hooks. Three cross-cutting concerns — authentication, mouse tracking, and window size — are each converted to a hook. The final InteractiveDashboard component demonstrates the key advantage: all three hooks compose in a flat component body with explicit data flow. There are no wrapper components in the DevTools tree, no prop name collisions, no ref forwarding issues, and no callback nesting. Each hook is independently testable with renderHook from Testing Library.",
      order_index: 3,
    },
  ],
  "compound-headless": [
    {
      title: "Compound Tab Component with Context, Controlled/Uncontrolled, and Accessibility",
      description:
        "A fully-featured compound Tab component using the context-based pattern — supports both controlled and uncontrolled modes, ARIA attributes for accessibility, keyboard navigation (arrow keys, Home, End), dynamic tab registration, and lazy panel rendering with an optional forceMount prop.",
      language: "javascript",
      code: `import React, {
  createContext, useContext, useState, useCallback, useRef, useId, useMemo, useEffect,
} from 'react';

// ── Context ────────────────────────────────────────────────────────────────
const TabsContext = createContext(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs sub-components must be used within <Tabs>');
  return ctx;
}

// ── Root: Tabs ─────────────────────────────────────────────────────────────
function Tabs({
  children,
  defaultValue,            // uncontrolled
  value: controlledValue,  // controlled
  onChange,
  orientation = 'horizontal',
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : internalValue;
  const tabsRef = useRef([]); // registered tab elements for keyboard nav

  const setActiveTab = useCallback((newValue) => {
    if (!isControlled) setInternalValue(newValue);
    onChange?.(newValue);
  }, [isControlled, onChange]);

  const registerTab = useCallback((value, element) => {
    tabsRef.current = tabsRef.current.filter((t) => t.value !== value);
    tabsRef.current.push({ value, element });
    tabsRef.current.sort((a, b) => {
      const aIdx = parseInt(a.element.dataset.index || '0', 10);
      const bIdx = parseInt(b.element.dataset.index || '0', 10);
      return aIdx - bIdx;
    });
  }, []);

  const ctx = useMemo(() => ({
    activeTab, setActiveTab, orientation, tabsRef, registerTab,
  }), [activeTab, setActiveTab, orientation, registerTab]);

  return (
    <TabsContext.Provider value={ctx}>
      <div className="tabs" data-orientation={orientation}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ── TabList ─────────────────────────────────────────────────────────────────
Tabs.List = function TabList({ children, className = '' }) {
  const { orientation, tabsRef, setActiveTab } = useTabs();

  // Keyboard navigation: ArrowLeft/Right (horizontal), ArrowUp/Down (vertical)
  const handleKeyDown = useCallback((e) => {
    const tabs = tabsRef.current;
    const currentIndex = tabs.findIndex((t) => t.element === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex;
    const isHorizontal = orientation === 'horizontal';

    switch (e.key) {
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    const nextTab = tabs[nextIndex];
    nextTab.element.focus();
    setActiveTab(nextTab.value);
  }, [orientation, tabsRef, setActiveTab]);

  return (
    <div
      className={\`tab-list \${className}\`}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

// ── Tab ─────────────────────────────────────────────────────────────────────
Tabs.Tab = function Tab({ value, children, disabled = false, index = 0 }) {
  const { activeTab, setActiveTab, registerTab } = useTabs();
  const isActive = activeTab === value;
  const id = useId();
  const ref = useRef(null);

  // Register this tab for keyboard navigation
  useEffect(() => {
    if (ref.current) registerTab(value, ref.current);
  }, [value, registerTab]);

  return (
    <button
      ref={ref}
      id={\`tab-\${id}\`}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      aria-controls={\`panel-\${id}\`}
      aria-disabled={disabled}
      data-index={index}
      className={\`tab \${isActive ? 'tab--active' : ''} \${disabled ? 'tab--disabled' : ''}\`}
      onClick={() => !disabled && setActiveTab(value)}
    >
      {children}
    </button>
  );
};

// ── Panel ───────────────────────────────────────────────────────────────────
Tabs.Panel = function TabPanel({ value, children, forceMount = false }) {
  const { activeTab } = useTabs();
  const isActive = activeTab === value;
  const id = useId();

  // forceMount renders the panel but hides it (useful for preserving state)
  if (!isActive && !forceMount) return null;

  return (
    <div
      id={\`panel-\${id}\`}
      role="tabpanel"
      tabIndex={0}
      aria-labelledby={\`tab-\${id}\`}
      hidden={!isActive}
      className="tab-panel"
    >
      {children}
    </div>
  );
};

// ── Usage: Uncontrolled ─────────────────────────────────────────────────────
function CodePlayground() {
  return (
    <Tabs defaultValue="editor">
      <Tabs.List>
        <Tabs.Tab value="editor" index={0}>Editor</Tabs.Tab>
        <Tabs.Tab value="preview" index={1}>Preview</Tabs.Tab>
        <Tabs.Tab value="console" index={2}>Console</Tabs.Tab>
        <Tabs.Tab value="settings" index={3} disabled>Settings</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="editor"><MonacoEditor /></Tabs.Panel>
      <Tabs.Panel value="preview"><LivePreview /></Tabs.Panel>
      <Tabs.Panel value="console" forceMount><ConsoleOutput /></Tabs.Panel>
      <Tabs.Panel value="settings"><EditorSettings /></Tabs.Panel>
    </Tabs>
  );
}

// ── Usage: Controlled ───────────────────────────────────────────────────────
function AnalyticsDashboard() {
  const [tab, setTab] = useState('overview');
  const { track } = useAnalytics();

  const handleTabChange = (newTab) => {
    track('tab_switch', { from: tab, to: newTab });
    setTab(newTab);
  };

  return (
    <Tabs value={tab} onChange={handleTabChange}>
      <Tabs.List>
        <Tabs.Tab value="overview" index={0}>Overview</Tabs.Tab>
        <Tabs.Tab value="revenue" index={1}>Revenue</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview"><OverviewChart /></Tabs.Panel>
      <Tabs.Panel value="revenue"><RevenueChart /></Tabs.Panel>
    </Tabs>
  );
}`,
      explanation:
        "This compound Tab component demonstrates the context-based approach with several advanced features: (1) controlled/uncontrolled dual mode — if a 'value' prop is provided, the component is controlled; otherwise it uses internal state; (2) full ARIA: role='tablist', role='tab', role='tabpanel', aria-selected, aria-controls, aria-labelledby, aria-orientation; (3) keyboard navigation with roving tabIndex — only the active tab has tabIndex=0, others have -1, and arrow keys cycle through tabs; (4) forceMount option on panels to keep content mounted (useful for preserving scroll position or heavy initializations); (5) disabled tabs. The sub-components communicate exclusively through context, making the API resilient to any DOM nesting structure.",
      order_index: 1,
    },
    {
      title: "Headless useDropdown Hook with Prop Getters",
      description:
        "A complete headless dropdown hook using the prop getters pattern — provides getTriggerProps, getListProps, and getItemProps that return the correct event handlers, ARIA attributes, and refs for each element. The consumer brings their own markup and styling while getting keyboard navigation, focus management, and accessibility for free.",
      language: "javascript",
      code: `import { useState, useCallback, useRef, useEffect, useId, useMemo } from 'react';

// ── Helper: compose event handlers without overriding ──────────────────────
function callAll(...fns) {
  return (...args) => fns.forEach((fn) => fn?.(...args));
}

// ── Headless Hook: useDropdown ─────────────────────────────────────────────
function useDropdown({
  items = [],
  onSelect,
  initialSelected = null,
  closeOnSelect = true,
  loop = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(initialSelected);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const dropdownId = useId();

  // ── Close on outside click ──
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !listRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── Focus management: scroll highlighted item into view ──
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;
    const listEl = listRef.current;
    const item = listEl?.querySelector(\`[data-index="\${highlightedIndex}"]\`);
    item?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, highlightedIndex]);

  // ── Select an item ──
  const selectItem = useCallback((item) => {
    setSelectedItem(item);
    onSelect?.(item);
    if (closeOnSelect) {
      setIsOpen(false);
      setHighlightedIndex(-1);
      triggerRef.current?.focus();
    }
  }, [onSelect, closeOnSelect]);

  // ── Keyboard handler ──
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) => {
            const next = prev + 1;
            return loop ? next % items.length : Math.min(next, items.length - 1);
          });
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev - 1;
          return loop
            ? (next + items.length) % items.length
            : Math.max(next, 0);
        });
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          selectItem(items[highlightedIndex]);
        } else {
          setIsOpen(true);
          setHighlightedIndex(0);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        triggerRef.current?.focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        setHighlightedIndex(items.length - 1);
        break;
      }
      default:
        break;
    }
  }, [isOpen, highlightedIndex, items, selectItem, loop]);

  // ── Prop Getters ────────────────────────────────────────────────────────
  // Each returns an object of props to spread onto the corresponding element.
  // Overrides are composed (not replaced) using callAll.

  const getTriggerProps = useCallback((overrides = {}) => ({
    ref: triggerRef,
    id: \`dropdown-trigger-\${dropdownId}\`,
    role: 'combobox',
    'aria-haspopup': 'listbox',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? \`dropdown-list-\${dropdownId}\` : undefined,
    onClick: callAll(overrides.onClick, () => {
      setIsOpen((o) => !o);
      if (!isOpen) setHighlightedIndex(0);
    }),
    onKeyDown: callAll(overrides.onKeyDown, handleKeyDown),
    ...overrides,
  }), [isOpen, handleKeyDown, dropdownId]);

  const getListProps = useCallback((overrides = {}) => ({
    ref: listRef,
    id: \`dropdown-list-\${dropdownId}\`,
    role: 'listbox',
    'aria-labelledby': \`dropdown-trigger-\${dropdownId}\`,
    'aria-activedescendant':
      highlightedIndex >= 0
        ? \`dropdown-item-\${dropdownId}-\${highlightedIndex}\`
        : undefined,
    tabIndex: -1,
    ...overrides,
  }), [highlightedIndex, dropdownId]);

  const getItemProps = useCallback((item, index, overrides = {}) => ({
    id: \`dropdown-item-\${dropdownId}-\${index}\`,
    role: 'option',
    'data-index': index,
    'aria-selected': selectedItem === item,
    'data-highlighted': highlightedIndex === index ? '' : undefined,
    onClick: callAll(overrides.onClick, () => selectItem(item)),
    onMouseEnter: callAll(overrides.onMouseEnter, () => setHighlightedIndex(index)),
    ...overrides,
  }), [selectedItem, highlightedIndex, selectItem, dropdownId]);

  return {
    isOpen,
    selectedItem,
    highlightedIndex,
    getTriggerProps,
    getListProps,
    getItemProps,
    open: () => setIsOpen(true),
    close: () => { setIsOpen(false); setHighlightedIndex(-1); },
  };
}

// ── Consumer: Styled Dropdown ──────────────────────────────────────────────
// The consumer provides ALL markup and styling; the hook provides behavior.

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'];

function LanguagePicker() {
  const {
    isOpen, selectedItem, highlightedIndex,
    getTriggerProps, getListProps, getItemProps,
  } = useDropdown({
    items: LANGUAGES,
    onSelect: (lang) => console.log('Selected:', lang),
    initialSelected: 'JavaScript',
  });

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <button
        {...getTriggerProps()}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white
                   hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
      >
        <span>{selectedItem || 'Select language'}</span>
        <svg className={\`w-4 h-4 transition \${isOpen ? 'rotate-180' : ''}\`}
             viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {/* List */}
      {isOpen && (
        <ul
          {...getListProps()}
          className="absolute mt-1 w-full bg-white border rounded-lg shadow-lg
                     max-h-60 overflow-auto z-10"
        >
          {LANGUAGES.map((lang, i) => (
            <li
              key={lang}
              {...getItemProps(lang, i)}
              className={\`px-4 py-2 cursor-pointer
                \${highlightedIndex === i ? 'bg-blue-50 text-blue-700' : ''}
                \${selectedItem === lang ? 'font-semibold' : ''}\`}
            >
              {lang}
              {selectedItem === lang && <span className="ml-auto">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}`,
      explanation:
        "The prop getters pattern (popularized by Downshift) is the core of headless UI design. Each getter — getTriggerProps, getListProps, getItemProps — returns the correct props (event handlers, ARIA attributes, ids, refs) for its element. Consumers spread these onto their own elements and add their own styling. The callAll helper composes event handlers so consumer handlers run alongside the hook's handlers instead of replacing them. The hook manages: open/close state, keyboard navigation (ArrowUp/Down, Enter, Escape, Home, End), outside-click dismissal, highlight tracking, scroll-into-view, and full ARIA attributes for listbox accessibility.",
      order_index: 2,
    },
    {
      title: "State Reducer Pattern for Customizable Component Behavior",
      description:
        "The state reducer pattern — an inversion-of-control technique that lets consumers customize internal state transitions by providing their own reducer. Demonstrates a toggle component that supports: preventing close when a form is dirty, limiting toggle count, and custom transition logic — all without the component author anticipating these use cases via props.",
      language: "javascript",
      code: `import { useReducer, useCallback, useMemo } from 'react';

// ============================================================================
// State Reducer Pattern — useToggle with customizable state transitions
// ============================================================================

// ── Action types (exported so consumers can reference them) ──
const ToggleActions = {
  TOGGLE: 'TOGGLE',
  OPEN: 'OPEN',
  CLOSE: 'CLOSE',
  RESET: 'RESET',
};

// ── Default reducer — the standard behavior ──────────────────────────────
function defaultToggleReducer(state, action) {
  switch (action.type) {
    case ToggleActions.TOGGLE:
      return { ...state, isOpen: !state.isOpen, toggleCount: state.toggleCount + 1 };
    case ToggleActions.OPEN:
      return { ...state, isOpen: true };
    case ToggleActions.CLOSE:
      return { ...state, isOpen: false };
    case ToggleActions.RESET:
      return { ...state, isOpen: false, toggleCount: 0 };
    default:
      return state;
  }
}

// ── Hook: useToggle with state reducer ───────────────────────────────────
function useToggle({
  initialOpen = false,
  reducer = defaultToggleReducer,
  onChange,
} = {}) {
  const initialState = { isOpen: initialOpen, toggleCount: 0 };

  // The consumer's reducer wraps (or replaces) the default reducer
  const [state, dispatch] = useReducer(reducer, initialState);

  const toggle = useCallback(() => {
    dispatch({ type: ToggleActions.TOGGLE });
    onChange?.(!state.isOpen);
  }, [state.isOpen, onChange]);

  const open = useCallback(() => {
    dispatch({ type: ToggleActions.OPEN });
    onChange?.(true);
  }, [onChange]);

  const close = useCallback(() => {
    dispatch({ type: ToggleActions.CLOSE });
    onChange?.(false);
  }, [onChange]);

  const reset = useCallback(() => {
    dispatch({ type: ToggleActions.RESET });
    onChange?.(false);
  }, [onChange]);

  // Prop getter for the toggle button
  const getToggleProps = useCallback((overrides = {}) => ({
    'aria-expanded': state.isOpen,
    onClick: (...args) => {
      overrides.onClick?.(...args);
      toggle();
    },
    ...overrides,
  }), [state.isOpen, toggle]);

  return {
    isOpen: state.isOpen,
    toggleCount: state.toggleCount,
    toggle, open, close, reset,
    getToggleProps,
  };
}


// ============================================================================
// Consumer 1: Prevent close when form is dirty
// ============================================================================

function useDirtyFormToggle(isDirty) {
  // Custom reducer: intercepts CLOSE when form is dirty
  const reducer = useCallback((state, action) => {
    if (action.type === ToggleActions.CLOSE && isDirty) {
      // Block the close — optionally you could show a confirmation dialog
      console.warn('Cannot close: form has unsaved changes');
      return state; // Return unchanged state
    }
    // For all other actions, delegate to the default reducer
    return defaultToggleReducer(state, action);
  }, [isDirty]);

  return useToggle({ reducer });
}

function EditorModal() {
  const [isDirty, setIsDirty] = useState(false);
  const { isOpen, open, close, getToggleProps } = useDirtyFormToggle(isDirty);

  return (
    <div>
      <button {...getToggleProps()}>
        {isOpen ? 'Close Editor' : 'Open Editor'}
      </button>

      {isOpen && (
        <div className="modal">
          <h2>Editor</h2>
          <textarea
            onChange={() => setIsDirty(true)}
            placeholder="Type something..."
          />
          <div className="modal-footer">
            <button onClick={() => { setIsDirty(false); close(); }}>
              Save & Close
            </button>
            <button onClick={close}>
              Cancel {isDirty && '(blocked — unsaved changes)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================================
// Consumer 2: Limit toggle count
// ============================================================================

function useLimitedToggle(maxToggles) {
  const reducer = useCallback((state, action) => {
    if (action.type === ToggleActions.TOGGLE && state.toggleCount >= maxToggles) {
      console.warn(\`Toggle limit of \${maxToggles} reached\`);
      return state; // Block further toggles
    }
    return defaultToggleReducer(state, action);
  }, [maxToggles]);

  return useToggle({ reducer });
}

function TrialFeature() {
  const { isOpen, toggleCount, toggle, reset } = useLimitedToggle(3);

  return (
    <div>
      <button onClick={toggle}>
        Toggle Feature ({3 - toggleCount} uses left)
      </button>
      {isOpen && <div className="feature">Premium Feature Content</div>}
      <button onClick={reset}>Reset Counter</button>
    </div>
  );
}


// ============================================================================
// Consumer 3: Custom transition with confirmation
// ============================================================================

function useConfirmedToggle(confirmMessage = 'Are you sure?') {
  const reducer = useCallback((state, action) => {
    // Intercept CLOSE to require confirmation
    if (action.type === ToggleActions.CLOSE || 
        (action.type === ToggleActions.TOGGLE && state.isOpen)) {
      if (!window.confirm(confirmMessage)) {
        return state; // User cancelled — don't close
      }
    }
    return defaultToggleReducer(state, action);
  }, [confirmMessage]);

  return useToggle({ reducer });
}

function DestructivePanel() {
  const { isOpen, getToggleProps } = useConfirmedToggle(
    'Close the panel? Progress will be lost.'
  );

  return (
    <div>
      <button {...getToggleProps()}>
        {isOpen ? 'Close Panel' : 'Open Panel'}
      </button>
      {isOpen && (
        <div className="panel">
          <p>Important operation in progress...</p>
        </div>
      )}
    </div>
  );
}

// ── Export ──────────────────────────────────────────────────────────────────
export { useToggle, defaultToggleReducer, ToggleActions };`,
      explanation:
        "The state reducer pattern is an inversion-of-control technique: instead of the component author adding props for every possible behavior variation (onBeforeClose, preventClose, maxToggles, requireConfirmation...), they expose a single 'reducer' prop. The consumer provides a custom reducer that intercepts specific actions and modifies the state transition. Three examples show how different consumers customize the same hook: (1) blocking close when a form is dirty, (2) limiting the number of toggles, (3) requiring confirmation before closing. Each custom reducer delegates to defaultToggleReducer for unmodified actions. This pattern is used by Downshift and Kent C. Dodds' libraries.",
      order_index: 3,
    },
  ],
};

export default examples;

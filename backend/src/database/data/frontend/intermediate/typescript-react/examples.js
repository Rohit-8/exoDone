// ============================================================================
// TypeScript with React — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  "typing-components-hooks": [
    {
      title: "Typed Form Component with Events",
      description:
        "A complete contact form demonstrating typed props, typed event handlers (ChangeEvent, FormEvent, FocusEvent), typed useState, typed useRef for focus management, discriminated union for submission state, and accessible error display — all with full TypeScript type safety.",
      language: "typescript",
      code: `import React, { useState, useRef } from 'react';

// ── 1. Form data type ──
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

// ── 2. Submission state — discriminated union ──
type SubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; ticketId: string }
  | { status: 'error'; message: string };

// ── 3. Validation errors — Record utility type ──
type FormErrors = Partial<Record<keyof ContactFormData, string>>;

// ── 4. Props interface ──
interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<{ ticketId: string }>;
  initialPriority?: ContactFormData['priority']; // indexed access type
  maxMessageLength?: number;
}

// ── 5. Component with explicit typing (not React.FC) ──
function ContactForm({
  onSubmit,
  initialPriority = 'medium',
  maxMessageLength = 500,
}: ContactFormProps): React.ReactElement {
  // Typed useState — generic needed for union state
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: initialPriority,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submission, setSubmission] = useState<SubmissionState>({ status: 'idle' });

  // Typed useRef — null initial = RefObject (read-only .current)
  const nameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // ── Typed change handler for text inputs ──
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ── Typed change handler for select ──
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priority = e.target.value as ContactFormData['priority'];
    setFormData((prev) => ({ ...prev, priority }));
  };

  // ── Typed focus handler ──
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select(); // select all text on focus
  };

  // ── Typed keyboard handler ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  // ── Validation function ──
  const validate = (data: ContactFormData): FormErrors => {
    const errs: FormErrors = {};
    if (!data.name.trim()) errs.name = 'Name is required';
    if (!data.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email)) {
      errs.email = 'Invalid email format';
    }
    if (!data.subject.trim()) errs.subject = 'Subject is required';
    if (!data.message.trim()) errs.message = 'Message is required';
    else if (data.message.length > maxMessageLength) {
      errs.message = \\\`Message must be \\\${maxMessageLength} characters or less\\\`;
    }
    return errs;
  };

  // ── Typed form submit handler ──
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Focus the first invalid field
      const firstErrorField = Object.keys(validationErrors)[0];
      const el = formRef.current?.querySelector<HTMLInputElement>(
        \\\`[name="\\\${firstErrorField}"]\\\`
      );
      el?.focus();
      return;
    }

    setSubmission({ status: 'submitting' });
    try {
      const result = await onSubmit(formData);
      setSubmission({ status: 'success', ticketId: result.ticketId });
      // TypeScript knows ticketId exists here because status is 'success'
    } catch (err) {
      setSubmission({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  // ── Render based on discriminated union status ──
  if (submission.status === 'success') {
    return (
      <div role="alert">
        <h2>Message Sent!</h2>
        <p>Your ticket ID: {submission.ticketId}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {submission.status === 'error' && (
        <div role="alert" style={{ color: '#e53e3e' }}>
          {submission.message}
        </div>
      )}

      <div>
        <label htmlFor="name">Name</label>
        <input
          ref={nameInputRef}
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          onFocus={handleFocus}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && <span id="name-error" role="alert">{errors.name}</span>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && <span id="email-error" role="alert">{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
        />
        {errors.subject && <span id="subject-error" role="alert">{errors.subject}</span>}
      </div>

      <div>
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          value={formData.priority}
          onChange={handleSelectChange}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={5}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        <span>{formData.message.length}/{maxMessageLength}</span>
        {errors.message && <span id="message-error" role="alert">{errors.message}</span>}
      </div>

      <button type="submit" disabled={submission.status === 'submitting'}>
        {submission.status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}`,
      explanation:
        "This example demonstrates comprehensive event typing in React+TypeScript: (1) React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> for text inputs using a union element type, (2) React.ChangeEvent<HTMLSelectElement> for select elements with type assertion to the literal union, (3) React.FormEvent<HTMLFormElement> for form submission with e.preventDefault(), (4) React.FocusEvent<HTMLInputElement> for focus handling, (5) React.KeyboardEvent<HTMLTextAreaElement> for keyboard shortcuts. The form also shows typed useState with generics, useRef<HTMLInputElement>(null) for DOM refs, a discriminated union (SubmissionState) for state machine rendering, Partial<Record<keyof T, string>> for error maps, and accessible error display with aria-invalid and aria-describedby.",
      order_index: 1,
    },
    {
      title: "Generic Data Table Component",
      description:
        "A fully generic, reusable Table<T> component demonstrating generic function components, keyof T constraints for column definitions, render props for custom cell rendering, typed callback props for row selection, and as const for sortable column configuration — a common interview pattern for advanced TypeScript+React.",
      language: "typescript",
      code: `import React, { useState, useMemo, useCallback } from 'react';

// ── 1. Generic column definition — key constrained to keyof T ──
interface Column<T> {
  key: keyof T & string;        // must be a string key of T
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode; // custom cell renderer
}

// ── 2. Sort direction with as const for type safety ──
const SORT_DIRECTIONS = ['asc', 'desc', 'none'] as const;
type SortDirection = (typeof SORT_DIRECTIONS)[number]; // 'asc' | 'desc' | 'none'

interface SortConfig<T> {
  key: keyof T & string;
  direction: Exclude<SortDirection, 'none'>; // only 'asc' | 'desc' when active
}

// ── 3. Generic table props ──
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  emptyMessage?: string;
  className?: string;
}

// ── 4. Generic component (cannot use React.FC for generics) ──
function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  selectable = false,
  onSelectionChange,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>): React.ReactElement {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(
    new Set()
  );

  // ── Sort logic with typed comparator ──
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Type-safe comparison
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // ── Typed sort handler ──
  const handleSort = useCallback((key: keyof T & string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null; // third click removes sort
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // ── Selection handler ──
  const handleSelect = useCallback(
    (item: T) => {
      const key = keyExtractor(item);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);

        // Notify parent with typed T[] array
        if (onSelectionChange) {
          const selectedItems = data.filter((d) => next.has(keyExtractor(d)));
          onSelectionChange(selectedItems);
        }
        return next;
      });
    },
    [data, keyExtractor, onSelectionChange]
  );

  // ── Select all handler ──
  const handleSelectAll = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        const allKeys = new Set(data.map(keyExtractor));
        setSelectedKeys(allKeys);
        onSelectionChange?.(data);
      } else {
        setSelectedKeys(new Set());
        onSelectionChange?.([]);
      }
    },
    [data, keyExtractor, onSelectionChange]
  );

  if (data.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }

  return (
    <table className={className} role="grid">
      <thead>
        <tr>
          {selectable && (
            <th>
              <input
                type="checkbox"
                checked={selectedKeys.size === data.length}
                onChange={handleSelectAll}
                aria-label="Select all rows"
              />
            </th>
          )}
          {columns.map((col) => (
            <th
              key={col.key}
              style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
              onClick={() => col.sortable && handleSort(col.key)}
              aria-sort={
                sortConfig?.key === col.key
                  ? sortConfig.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              }
            >
              {col.header}
              {col.sortable && sortConfig?.key === col.key && (
                <span>{sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row) => {
          const key = keyExtractor(row);
          return (
            <tr
              key={key}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              aria-selected={selectable ? selectedKeys.has(key) : undefined}
            >
              {selectable && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(key)}
                    onChange={() => handleSelect(row)}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    aria-label={\\\`Select row \\\${key}\\\`}
                  />
                </td>
              )}
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── 5. Usage — TypeScript infers T as Product ──
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

function ProductPage() {
  const [products] = useState<Product[]>([
    { id: 1, name: 'Keyboard', price: 79.99, category: 'Electronics', inStock: true },
    { id: 2, name: 'Mouse', price: 29.99, category: 'Electronics', inStock: false },
    { id: 3, name: 'Desk Lamp', price: 45.00, category: 'Office', inStock: true },
  ]);

  const handleSelection = (selected: Product[]) => {
    // TypeScript knows selected is Product[] — full intellisense
    console.log('Selected:', selected.map((p) => p.name));
  };

  return (
    <DataTable
      data={products}
      columns={[
        { key: 'name', header: 'Product', sortable: true },
        { key: 'price', header: 'Price', sortable: true,
          render: (val) => \\\`$\\\${(val as number).toFixed(2)}\\\` },
        { key: 'category', header: 'Category', sortable: true },
        { key: 'inStock', header: 'Status',
          render: (val) => (val ? '✅ In Stock' : '❌ Out of Stock') },
        // ❌ { key: 'color', header: 'Color' } — TypeScript error: 'color' ∉ keyof Product
      ]}
      keyExtractor={(p) => p.id}
      onRowClick={(p) => console.log('Clicked:', p.name)}
      selectable
      onSelectionChange={handleSelection}
    />
  );
}`,
      explanation:
        "This example demonstrates advanced generic component patterns: (1) Table<T> is a generic function — React.FC cannot express this, which is why explicit typing is preferred, (2) Column<T> uses 'keyof T & string' to constrain column keys to actual properties of T, providing compile-time safety against typos, (3) the render prop receives T[keyof T] for the cell value and T for the full row — enabling custom cell rendering while maintaining type flow, (4) as const on SORT_DIRECTIONS creates a readonly tuple from which we extract a union type using indexed access, (5) Exclude<SortDirection, 'none'> narrows the active sort direction to only 'asc' | 'desc', (6) selection callbacks are typed as T[] arrays so consumers get full type inference, and (7) all event handlers (ChangeEvent<HTMLInputElement>, MouseEvent) are explicitly typed with their element generics.",
      order_index: 2,
    },
    {
      title: "Discriminated Union Notification Component",
      description:
        "A notification system using discriminated unions, exhaustive switch-case checking with the 'never' type, useReducer with typed actions, useContext with a typed custom hook, and ComponentPropsWithRef for extending HTML element props — demonstrating how TypeScript prevents impossible states.",
      language: "typescript",
      code: `import React, { useReducer, useContext, createContext, useCallback, useEffect, forwardRef } from 'react';
import type { ComponentPropsWithRef } from 'react';

// ══════════════════════════════════════════════════════════════════
// 1. DISCRIMINATED UNION — each notification type has exactly
//    the data it needs. No optional props, no impossible states.
// ══════════════════════════════════════════════════════════════════

type Notification =
  | {
      id: string;
      type: 'success';
      title: string;
      message: string;
      duration?: number;      // auto-dismiss after ms
    }
  | {
      id: string;
      type: 'error';
      title: string;
      message: string;
      errorCode?: number;     // only errors have codes
      retryAction?: () => void; // only errors can be retried
    }
  | {
      id: string;
      type: 'warning';
      title: string;
      message: string;
      dismissible?: boolean;  // warnings can be made non-dismissible
    }
  | {
      id: string;
      type: 'info';
      title: string;
      message: string;
      link?: { url: string; label: string }; // only info can have links
    };

// ══════════════════════════════════════════════════════════════════
// 2. REDUCER — discriminated union actions with exhaustive checking
// ══════════════════════════════════════════════════════════════════

type NotificationAction =
  | { type: 'ADD'; payload: Notification }
  | { type: 'REMOVE'; payload: { id: string } }
  | { type: 'CLEAR_ALL' };

interface NotificationState {
  notifications: Notification[];
  maxVisible: number;
}

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case 'ADD':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE':
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload.id
        ),
      };
    case 'CLEAR_ALL':
      return { ...state, notifications: [] };
    default: {
      // Exhaustiveness check — TypeScript errors if a new action
      // type is added but not handled above
      const _exhaustive: never = action;
      throw new Error(\\\`Unhandled action: \\\${JSON.stringify(_exhaustive)}\\\`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// 3. CONTEXT with typed custom hook (undefined default pattern)
// ══════════════════════════════════════════════════════════════════

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

// Custom hook with non-null guard — consumers never need to check for undefined
function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (ctx === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}

// ══════════════════════════════════════════════════════════════════
// 4. PROVIDER component
// ══════════════════════════════════════════════════════════════════

function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    maxVisible: 5,
  });

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>): string => {
      const id = crypto.randomUUID();
      // TypeScript requires 'id' + all fields of the specific union member
      dispatch({ type: 'ADD', payload: { ...notification, id } as Notification });
      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', payload: { id } });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const value: NotificationContextValue = {
    notifications: state.notifications.slice(0, state.maxVisible),
    addNotification,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ══════════════════════════════════════════════════════════════════
// 5. NOTIFICATION CARD — exhaustive rendering with type narrowing
// ══════════════════════════════════════════════════════════════════

// Extend HTML div props via ComponentPropsWithRef
interface NotificationCardProps
  extends Omit<ComponentPropsWithRef<'div'>, 'id'> {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationCard = forwardRef<HTMLDivElement, NotificationCardProps>(
  ({ notification, onDismiss, className, ...rest }, ref) => {
    const { removeNotification } = useNotifications();

    // Auto-dismiss for success notifications
    useEffect(() => {
      if (notification.type === 'success' && notification.duration) {
        const timer = setTimeout(
          () => removeNotification(notification.id),
          notification.duration
          // TypeScript knows 'duration' exists because type is 'success'
        );
        return () => clearTimeout(timer);
      }
    }, [notification, removeNotification]);

    // ── Type-specific content rendering ──
    const renderContent = (n: Notification): React.ReactNode => {
      switch (n.type) {
        case 'success':
          return <p>{n.message}</p>;

        case 'error':
          return (
            <div>
              <p>{n.message}</p>
              {n.errorCode && <code>Error code: {n.errorCode}</code>}
              {n.retryAction && (
                <button onClick={n.retryAction}>Retry</button>
              )}
            </div>
          );

        case 'warning':
          return (
            <div>
              <p>{n.message}</p>
              {n.dismissible === false && (
                <small>This warning cannot be dismissed</small>
              )}
            </div>
          );

        case 'info':
          return (
            <div>
              <p>{n.message}</p>
              {n.link && (
                <a href={n.link.url} target="_blank" rel="noopener noreferrer">
                  {n.link.label}
                </a>
              )}
            </div>
          );

        default: {
          const _exhaustive: never = n;
          return null;
        }
      }
    };

    const canDismiss =
      notification.type !== 'warning' || notification.dismissible !== false;

    return (
      <div
        ref={ref}
        role="alert"
        aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
        className={\\\`notification notification--\\\${notification.type} \\\${className ?? ''}\\\`}
        {...rest}
      >
        <div className="notification__header">
          <strong>{notification.title}</strong>
          {canDismiss && (
            <button
              onClick={() => onDismiss(notification.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          )}
        </div>
        <div className="notification__body">
          {renderContent(notification)}
        </div>
      </div>
    );
  }
);

NotificationCard.displayName = 'NotificationCard';

// ══════════════════════════════════════════════════════════════════
// 6. USAGE — type-safe notification creation
// ══════════════════════════════════════════════════════════════════

function DashboardPage() {
  const { addNotification, notifications, removeNotification, clearAll } =
    useNotifications();

  const handleSave = async () => {
    try {
      await saveData();
      addNotification({
        type: 'success',
        title: 'Saved',
        message: 'Your changes have been saved.',
        duration: 3000,
        // ❌ errorCode here would be a TypeScript error — only 'error' type has it
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        errorCode: 500,
        retryAction: handleSave, // typed as () => void
        // ❌ duration here would be a TypeScript error — only 'success' type has it
      });
    }
  };

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <button onClick={clearAll}>Clear All</button>

      <div className="notification-container" aria-label="Notifications">
        {notifications.map((n) => (
          <NotificationCard
            key={n.id}
            notification={n}
            onDismiss={removeNotification}
          />
        ))}
      </div>
    </div>
  );
}`,
      explanation:
        "This example demonstrates how discriminated unions prevent impossible states in React+TypeScript: (1) the Notification type uses 'type' as the discriminant — each variant has exactly the properties it needs (only 'error' has errorCode/retryAction, only 'success' has duration, only 'info' has link), so you cannot accidentally mix them, (2) the reducer uses discriminated union actions with an exhaustive default case using 'never' — adding a new action without handling it causes a compile error, (3) useContext is typed with '| undefined' default and a custom hook (useNotifications) that throws if called outside the provider — eliminating null checks at every usage site, (4) the renderContent switch statement uses type narrowing — inside case 'error', TypeScript knows n.errorCode and n.retryAction exist, (5) ComponentPropsWithRef<'div'> extends the notification card to accept all div HTML attributes including ref forwarding via forwardRef, and (6) Omit<Notification, 'id'> is used for the addNotification parameter because the provider generates IDs internally.",
      order_index: 3,
    },
  ],
};

export default examples;

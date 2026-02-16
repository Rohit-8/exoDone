// ============================================================================
// TypeScript with React — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  "typing-components-hooks": [
    {
      question_text:
        "Why has the React community shifted away from React.FC in favor of explicit return typing for function components?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "React.FC causes runtime performance overhead because it wraps the component in a higher-order function that adds extra reconciliation steps",
        "React.FC does not support generic components, implicitly injected children in React ≤17 (removed in 18), and has poor defaultProps inference — explicit typing avoids all these limitations",
        "React.FC is deprecated in React 18 and will be removed in React 19 — using it causes TypeScript compilation warnings",
        "React.FC forces all components to be arrow functions, which prevents using hooks like useImperativeHandle that require class components",
      ]),
      correct_answer:
        "React.FC does not support generic components, implicitly injected children in React ≤17 (removed in 18), and has poor defaultProps inference — explicit typing avoids all these limitations",
      explanation:
        "React.FC has three main drawbacks: (1) It cannot express generic components — you cannot write 'const Table: React.FC<TableProps<T>>' because the generic T has no place to be declared. With explicit typing, you write 'function Table<T>(props: TableProps<T>)' naturally. (2) In React 17 and below, React.FC implicitly added 'children?: ReactNode' to every component's props, even components that shouldn't accept children — this was fixed in the React 18 type definitions but caused years of confusion. (3) defaultProps inference is broken with React.FC because TypeScript cannot properly merge the defaultProps type with the component's props type. React.FC is NOT deprecated — it still works — but the community and React team recommend explicit typing for these practical reasons.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "What is the critical difference between useRef<HTMLInputElement>(null) and useRef<HTMLInputElement>(initialValue), and how does TypeScript enforce it?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "There is no difference — both return MutableRefObject<HTMLInputElement> with a writable .current property",
        "useRef(null) returns RefObject<T> with a read-only .current (T | null) for DOM refs; useRef(initialValue) returns MutableRefObject<T> with a writable .current for instance variables — TypeScript uses the initial value to determine mutability",
        "useRef(null) creates a ref that can only be attached to DOM elements via the ref prop; useRef(initialValue) creates a ref that can only store JavaScript objects and primitives",
        "useRef(null) automatically cleans up the ref on unmount; useRef(initialValue) persists the value even after the component is unmounted from the DOM",
      ]),
      correct_answer:
        "useRef(null) returns RefObject<T> with a read-only .current (T | null) for DOM refs; useRef(initialValue) returns MutableRefObject<T> with a writable .current for instance variables — TypeScript uses the initial value to determine mutability",
      explanation:
        "TypeScript's React type definitions use overloads to distinguish: when you pass null as the initial value (useRef<T>(null)), the return type is React.RefObject<T>, where .current is typed as T | null and is read-only — you cannot reassign .current directly, which is correct for DOM refs (React manages the .current value). When you pass a non-null initial value (useRef<number>(0)), the return type is React.MutableRefObject<T>, where .current is typed as T and is writable — this is for storing mutable instance variables like timer IDs, previous values, or render counts. This distinction exists because DOM refs should not be manually reassigned (React handles attachment/detachment), while instance-variable refs need to be writable.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "How should you type a React context that might not have a provider, and why is createContext<T | undefined>(undefined) with a custom hook preferred over providing a default value?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Use createContext<T>(null as any) and cast the value in the provider — this avoids the need for a custom hook while maintaining full type safety",
        "Use createContext<T | undefined>(undefined) and create a custom hook that throws if the value is undefined — this eliminates null checks at every consumption site and catches missing providers at runtime with a clear error message",
        "Use createContext<T>({} as T) with an empty object cast to T — TypeScript treats this as the full type, so consumers never need null checks",
        "Use createContext<T | null>(null) with optional chaining at every usage site — this is safer because it handles the missing provider case gracefully without throwing",
      ]),
      correct_answer:
        "Use createContext<T | undefined>(undefined) and create a custom hook that throws if the value is undefined — this eliminates null checks at every consumption site and catches missing providers at runtime with a clear error message",
      explanation:
        "The recommended pattern is: (1) createContext<AuthContextValue | undefined>(undefined) — the undefined default is honest about the fact that no provider exists yet, (2) a custom hook like useAuth() that calls useContext(AuthContext) and throws if the value is undefined: 'if (ctx === undefined) throw new Error(\"useAuth must be used within AuthProvider\")'. After the throw guard, TypeScript narrows the return type from 'T | undefined' to just 'T', so every consumer gets the full type without null checks. Using 'null as any' or '{} as T' creates type lies — the code compiles but will crash at runtime when accessing properties on the fake object. Using null with optional chaining everywhere adds noise to every consumer and doesn't catch the real bug (missing provider).",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "In TypeScript, what is the purpose of the 'never' type in a switch statement's default case when handling discriminated union actions in a reducer?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The 'never' type tells TypeScript to skip type checking for the default case, since it should be unreachable in correctly typed code",
        "Assigning the action to a 'never' variable creates an exhaustiveness check — if a new union member is added but not handled in a case, TypeScript will error because the unhandled type cannot be assigned to 'never'",
        "The 'never' type automatically generates a runtime error when the default case is reached, without needing an explicit throw statement",
        "The 'never' type is required by React's useReducer hook to infer the correct return type of the reducer function",
      ]),
      correct_answer:
        "Assigning the action to a 'never' variable creates an exhaustiveness check — if a new union member is added but not handled in a case, TypeScript will error because the unhandled type cannot be assigned to 'never'",
      explanation:
        "The 'never' type represents values that should never exist. In a switch statement handling a discriminated union like 'type Action = { type: \"ADD\" } | { type: \"REMOVE\" }', after handling all cases, the action in the default branch is narrowed to 'never' — no possible values remain. Writing 'const _exhaustive: never = action' compiles successfully. BUT if you later add '{ type: \"UPDATE\" }' to the union without adding a case for it, the action in the default branch is narrowed to '{ type: \"UPDATE\" }', which cannot be assigned to 'never' — TypeScript produces a compile error. This forces you to handle every action type, preventing bugs where new actions silently fall through to the default case. This is purely a compile-time check — it generates no runtime overhead.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "When building a generic Table<T> component, why must the column key be typed as 'keyof T' rather than 'string', and what compile-time safety does this provide?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Using 'keyof T' provides better runtime performance because TypeScript generates optimized property access code for known keys",
        "Using 'keyof T' constrains the column key to actual properties of the data type T — TypeScript will error if you specify a column key like 'address' that doesn't exist on T, catching typos and mismatches at compile time",
        "Using 'keyof T' is required for React's reconciliation algorithm to correctly identify which columns changed during re-renders",
        "Using 'keyof T' automatically generates column headers from the property names, eliminating the need for a separate header property",
      ]),
      correct_answer:
        "Using 'keyof T' constrains the column key to actual properties of the data type T — TypeScript will error if you specify a column key like 'address' that doesn't exist on T, catching typos and mismatches at compile time",
      explanation:
        "When you define Column<T> with 'key: keyof T', TypeScript ensures that every column references an actual property of the data type. For example, if T is '{ id: number; name: string; email: string }', then keyof T is 'id' | 'name' | 'email'. Trying to add a column with key: 'address' produces a compile error: 'Type \"address\" is not assignable to type \"id\" | \"name\" | \"email\"'. This catches typos (key: 'nmae' instead of 'name') and prevents columns that reference nonexistent data. Additionally, the render callback can be typed as '(value: T[keyof T], row: T) => ReactNode', giving the renderer access to the correctly-typed cell value and full row. This is a purely compile-time feature — 'keyof T' erases to 'string' in the emitted JavaScript.",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text:
        "What does 'as const' assertion do when applied to an array like const ROLES = ['admin', 'editor', 'viewer'] as const, and how do you extract a union type from it?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "'as const' freezes the array at runtime using Object.freeze() and types it as readonly string[] — you extract a union with typeof ROLES",
        "'as const' makes TypeScript infer the array as a readonly tuple of literal types (readonly ['admin', 'editor', 'viewer']) instead of string[] — you extract the union type with (typeof ROLES)[number], which gives 'admin' | 'editor' | 'viewer'",
        "'as const' converts the array into a TypeScript enum at compile time — you access the union via keyof typeof ROLES",
        "'as const' is a runtime assertion that validates the array only contains the specified values — the union type is extracted with ROLES[keyof ROLES]",
      ]),
      correct_answer:
        "'as const' makes TypeScript infer the array as a readonly tuple of literal types (readonly ['admin', 'editor', 'viewer']) instead of string[] — you extract the union type with (typeof ROLES)[number], which gives 'admin' | 'editor' | 'viewer'",
      explanation:
        "'as const' is a purely compile-time assertion (no runtime effect — no Object.freeze()). Without it, const ROLES = ['admin', 'editor', 'viewer'] is typed as string[] — the literal values are widened. With 'as const', TypeScript infers the type as 'readonly [\"admin\", \"editor\", \"viewer\"]' — a readonly tuple where each position has a specific literal type. To extract a union: 'type Role = (typeof ROLES)[number]' produces 'admin' | 'editor' | 'viewer'. The '[number]' is an indexed access type that gets the type at any numeric index of the tuple. This pattern is powerful for defining constants once and deriving types from them — the type and values stay in sync automatically. It works with objects too: 'const THEME = { primary: \"#3b82f6\" } as const' makes the value type '\"#3b82f6\"' instead of 'string'.",
      difficulty: "medium",
      order_index: 6,
    },
    {
      question_text:
        "How do discriminated union props prevent impossible states in React components, and what role does the 'never' type play in the prop definitions?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Discriminated unions use a shared 'type' prop to switch between variants; 'never' in prop definitions is used to generate runtime validation that throws if invalid prop combinations are passed",
        "Discriminated unions define each variant with exactly the props it needs; setting excluded props to 'never' (e.g., href?: never when as='button') makes TypeScript reject those props at compile time, ensuring mutually exclusive prop combinations",
        "Discriminated unions require all variants to have the same props with different types; 'never' forces the component to handle all variants in the render method or TypeScript throws a compile error",
        "Discriminated unions split the component into multiple separate components internally; 'never' is used as the return type for variants that should not render anything",
      ]),
      correct_answer:
        "Discriminated unions define each variant with exactly the props it needs; setting excluded props to 'never' (e.g., href?: never when as='button') makes TypeScript reject those props at compile time, ensuring mutually exclusive prop combinations",
      explanation:
        "Discriminated union props model mutually exclusive component configurations. For example: type ButtonProps = | { as: 'button'; onClick: () => void; href?: never } | { as: 'link'; href: string; onClick?: never }. When 'as' is 'button', TypeScript only allows onClick and rejects href because href is typed as 'never' — a type that no value can satisfy. When 'as' is 'link', the reverse applies. This prevents impossible states like a button with both onClick and href, or a link without href. Without discriminated unions, you'd use optional props (onClick?: ..., href?: ...), which allows consumers to pass both or neither — creating ambiguous states that cause runtime bugs. The 'never' type here is purely a compile-time constraint with no runtime overhead.",
      difficulty: "hard",
      order_index: 7,
    },
    {
      question_text:
        "What is the correct way to type a React event handler for an input element's onChange event, and what is the difference between e.target and e.currentTarget?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Use React.InputEvent<HTMLInputElement>; e.target is the element the handler is attached to, e.currentTarget is the element that triggered the event during bubbling",
        "Use React.ChangeEvent<HTMLInputElement>; e.target is the element that originally dispatched the event (may differ during bubbling), e.currentTarget is always the element the handler is attached to — both are typed as HTMLInputElement in this case",
        "Use React.SyntheticEvent<HTMLInputElement>; e.target and e.currentTarget are identical and always refer to the input element — the distinction only matters for native DOM events",
        "Use Event from the DOM API directly; React wraps it in SyntheticEvent but the typing for target and currentTarget is always 'EventTarget', requiring manual type assertions",
      ]),
      correct_answer:
        "Use React.ChangeEvent<HTMLInputElement>; e.target is the element that originally dispatched the event (may differ during bubbling), e.currentTarget is always the element the handler is attached to — both are typed as HTMLInputElement in this case",
      explanation:
        "React.ChangeEvent<HTMLInputElement> is the correct type for an input's onChange handler. The generic parameter (HTMLInputElement) types e.currentTarget as HTMLInputElement — this is always the element the handler is attached to. e.target is typed as EventTarget by default in the base type, but in practice (and with React's typing for ChangeEvent), both refer to the same element for onChange. The distinction matters more with events that bubble: for onClick on a parent div, e.currentTarget is the div (where the handler lives), while e.target could be a child button that was actually clicked. Using the specific event type (ChangeEvent vs FormEvent vs MouseEvent) and element type (HTMLInputElement vs HTMLSelectElement) gives full type safety for properties like e.target.value, e.target.checked, or e.currentTarget.elements.",
      difficulty: "medium",
      order_index: 8,
    },
  ],
};

export default quiz;

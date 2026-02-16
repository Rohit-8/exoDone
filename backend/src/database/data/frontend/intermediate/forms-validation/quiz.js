// ============================================================================
// Forms & Validation — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  "react-hook-form": [
    {
      question_text:
        "What is the primary reason React Hook Form achieves better performance than Formik for form handling?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It uses Web Workers to offload validation from the main thread",
        "It uses uncontrolled inputs with refs, so the form component does not re-render on every keystroke — values live in the DOM, not React state",
        "It compiles form validation rules into WebAssembly at build time for faster execution",
        "It batches all input changes into a single microtask and only re-renders once per event loop tick",
      ]),
      correct_answer:
        "It uses uncontrolled inputs with refs, so the form component does not re-render on every keystroke — values live in the DOM, not React state",
      explanation:
        "React Hook Form's core performance advantage is its uncontrolled input strategy. When you call register('fieldName'), RHF attaches a ref to the DOM input and reads values directly from the DOM when needed (e.g., on submit or validation). Unlike Formik's controlled approach — which calls setState on every keystroke and re-renders the entire form — RHF achieves near-zero re-renders. Only the specific error display component for a field re-renders when validation state changes, not the whole form.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "In React Hook Form, what does the register function return when called, and why should it be spread onto the input element?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It returns a React state value and setter pair — spreading them sets `value` and `onChange` for controlled input behavior",
        "It returns an object with `ref`, `name`, `onChange`, and `onBlur` — spreading connects the input to RHF's internal tracking without using React state",
        "It returns a single `ref` callback — spreading is not required, you only need to pass it as the ref prop",
        "It returns an object with `value`, `defaultValue`, and `onInput` — spreading establishes two-way data binding with the form store",
      ]),
      correct_answer:
        "It returns an object with `ref`, `name`, `onChange`, and `onBlur` — spreading connects the input to RHF's internal tracking without using React state",
      explanation:
        "register('fieldName') returns { name, ref, onChange, onBlur }. The `ref` lets RHF read the DOM value directly. The `onChange` and `onBlur` handlers update RHF's internal state and trigger validation based on the configured mode (onSubmit, onBlur, onChange, etc.). The `name` identifies the field in the form data. Spreading these onto the input ({...register('name')}) is the standard pattern because it connects all four properties at once. Importantly, this does NOT create React state — values stay in the DOM.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text:
        "How does Zod's .refine() method handle cross-field validation like password confirmation, and where does the error appear?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "refine() only works on individual fields — cross-field validation requires a separate validation step outside the schema",
        "refine() is called on the parent z.object() and receives the full data object; the `path` option specifies which field the error attaches to (e.g., path: ['confirmPassword'])",
        "refine() automatically detects related fields by name similarity and attaches errors to both fields simultaneously",
        "refine() creates a global form error that appears at the top of the form — it cannot target specific fields",
      ]),
      correct_answer:
        "refine() is called on the parent z.object() and receives the full data object; the `path` option specifies which field the error attaches to (e.g., path: ['confirmPassword'])",
      explanation:
        "Zod's .refine() enables cross-field validation by chaining it on the z.object() schema: schema.refine(data => data.password === data.confirmPassword, { message: 'Passwords must match', path: ['confirmPassword'] }). The callback receives the full parsed data object, so it can compare any fields. The `path` array specifies which field in the errors object should receive the error message. Without `path`, the error would appear as a root-level form error. For more complex multi-field validation, .superRefine() provides access to the ctx.addIssue() method for adding multiple errors at once.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "When using useFieldArray, why is it critical to use field.id as the React key instead of the array index?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Using index as key causes React Hook Form to throw a runtime error because it validates key uniqueness",
        "Using index as key causes input values to get mixed up when items are removed or reordered, because React reuses DOM elements based on key and the index shifts when the array changes",
        "field.id is required for TypeScript type safety — index keys are not compatible with the useFieldArray generic type",
        "Performance only — field.id enables React Hook Form's internal diff algorithm, but index keys work correctly with slightly worse performance",
      ]),
      correct_answer:
        "Using index as key causes input values to get mixed up when items are removed or reordered, because React reuses DOM elements based on key and the index shifts when the array changes",
      explanation:
        "When you remove item at index 1 from a 3-item array, the item at index 2 becomes index 1. If you used index as key, React thinks the element at key=1 is the same component — it reuses the DOM element and its uncontrolled input value, causing the wrong value to appear in the wrong row. field.id is a stable unique identifier generated by useFieldArray that stays constant regardless of array mutations (remove, reorder, swap, move). This ensures React correctly unmounts removed items and preserves the correct values during reordering. This is a common interview question for dynamic forms.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "What is the difference between the watch() and getValues() methods in React Hook Form?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "watch() reads values synchronously while getValues() returns a Promise that resolves with the values",
        "watch() subscribes to value changes and triggers component re-renders when values change; getValues() reads current values without subscribing and does not cause re-renders",
        "watch() only works with controlled inputs while getValues() only works with uncontrolled inputs",
        "There is no difference — they are aliases that both return current form values without re-rendering",
      ]),
      correct_answer:
        "watch() subscribes to value changes and triggers component re-renders when values change; getValues() reads current values without subscribing and does not cause re-renders",
      explanation:
        "watch('fieldName') creates a subscription — the component re-renders whenever that field's value changes. This is ideal for conditional UI (show/hide fields based on a value, live previews, computed totals). getValues('fieldName') is a one-time read — it returns the current value without subscribing, so no re-renders occur. Use getValues() inside event handlers, useEffect callbacks, or any place where you just need the current value without reactive updates. watch() also supports a callback form: watch((values, { name }) => { ... }) which handles side effects without re-rendering, but you must unsubscribe in cleanup.",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text:
        "Which set of ARIA attributes correctly makes a form input accessible when it has a validation error?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "aria-error='true' on the input and aria-label on the error message element",
        "aria-invalid='true' on the input, aria-describedby pointing to the error message element's id, and role='alert' on the error message element",
        "aria-errormessage='true' on the input and aria-live='assertive' on the form element",
        "aria-required='true' on the input is sufficient — screen readers automatically detect and announce validation errors from the DOM",
      ]),
      correct_answer:
        "aria-invalid='true' on the input, aria-describedby pointing to the error message element's id, and role='alert' on the error message element",
      explanation:
        "The correct accessibility pattern for form errors uses three attributes together: (1) aria-invalid='true' on the input tells screen readers the field's value is invalid, (2) aria-describedby='error-id' on the input links it to the error message element so screen readers announce the error when the field is focused, and (3) role='alert' on the error message element creates a live region that causes screen readers to announce the error immediately when it appears (without requiring the user to navigate to it). Additionally, aria-required='true' should be used for required fields. This pattern is recommended by WAI-ARIA authoring practices for forms.",
      difficulty: "medium",
      order_index: 6,
    },
    {
      question_text:
        "In a multi-step wizard form built with React Hook Form, what is the recommended approach to validate only the current step's fields before allowing navigation to the next step?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Create a separate useForm instance for each step and merge the data on final submission",
        "Use a single useForm instance and call trigger() with an array of only the current step's field names — trigger returns a boolean indicating if those specific fields are valid",
        "Disable the 'Next' button using the isValid property from formState, which automatically tracks per-step validity",
        "Use the validate() method from the schema resolver to check only specific fields against a partial schema",
      ]),
      correct_answer:
        "Use a single useForm instance and call trigger() with an array of only the current step's field names — trigger returns a boolean indicating if those specific fields are valid",
      explanation:
        "The recommended pattern is a single useForm instance holding all fields across all steps, with step-specific validation via trigger(['field1', 'field2']). When the user clicks 'Next', call const isValid = await trigger(currentStepFields); if (isValid) setStep(s => s + 1). This approach has three advantages: (1) all form data is preserved in one place as users navigate back and forth, (2) validation runs only on the current step's fields, and (3) no external state management is needed to merge data. Using separate useForm instances per step would require manual data merging and lose the benefit of cross-step validation (e.g., a field on step 2 depending on a value from step 1).",
      difficulty: "hard",
      order_index: 7,
    },
    {
      question_text:
        "What is the key difference between Yup and Zod that makes Zod preferred in TypeScript projects?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Zod validates at compile time using the TypeScript compiler, while Yup only validates at runtime",
        "Zod provides first-class type inference via z.infer<typeof schema>, so the validation schema IS the TypeScript type — they are always in sync without manual type definitions",
        "Zod generates TypeScript declaration files (.d.ts) from schemas, while Yup requires writing interfaces manually",
        "Zod uses TypeScript decorators for validation, which are more performant than Yup's chaining API",
      ]),
      correct_answer:
        "Zod provides first-class type inference via z.infer<typeof schema>, so the validation schema IS the TypeScript type — they are always in sync without manual type definitions",
      explanation:
        "Zod's killer feature for TypeScript is z.infer<typeof schema>. When you define a Zod schema, you can extract the TypeScript type directly: type FormData = z.infer<typeof mySchema>. If you add, remove, or change a field in the schema, the type updates automatically — there's no risk of the type and validation logic getting out of sync. Yup supports InferType<typeof schema> but it was added later and has some limitations with transforms and conditional validation. Zod was built TypeScript-first from the ground up, making the integration seamless. Both libraries validate at runtime only — neither uses the TypeScript compiler for validation.",
      difficulty: "medium",
      order_index: 8,
    },
  ],
};

export default quiz;

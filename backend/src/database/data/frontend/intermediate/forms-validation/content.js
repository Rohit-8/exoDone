// ============================================================================
// Forms & Validation — Content (ENHANCED)
// ============================================================================

export const topic = {
  name: "Forms & Validation",
  slug: "forms-validation",
  description:
    "Build performant, accessible forms with React Hook Form and schema-based validation using Yup/Zod.",
  estimated_time: 160,
  order_index: 5,
};

export const lessons = [
  {
    title: "React Hook Form & Validation Schemas",
    slug: "react-hook-form",
    summary:
      "Build performant forms with React Hook Form and validate with Yup/Zod schemas.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 1,
    key_points: [
      "Controlled vs uncontrolled inputs: why React Hook Form's uncontrolled approach avoids unnecessary re-renders and outperforms Formik",
      "Core useForm API: register, handleSubmit, formState (errors, isSubmitting, isDirty, isValid, touchedFields, dirtyFields)",
      "Built-in validation rules (required, minLength, maxLength, pattern, validate) and custom async validation functions",
      "Schema-based validation with Yup (object().shape, string, number, mixed) and Zod (z.object, z.string, z.number, refinements) via resolvers",
      "Dynamic form fields with useFieldArray: append, remove, move, swap, insert, and prepend operations",
      "Programmatic control: watch, setValue, getValues, reset, trigger for imperative form management",
      "Accessibility patterns: aria-invalid, aria-describedby, aria-required, focus management on errors, and live error announcements",
      "Advanced patterns: multi-step wizard forms, file uploads, dependent field validation, and form performance optimization",
    ],
    content: `
# React Hook Form & Validation Schemas

Forms are the backbone of most web applications — login, registration, checkout, search, settings. In interviews, you'll be expected to explain **why** React Hook Form (RHF) is the modern standard, how schema validation works, and how to build accessible, performant forms. This lesson covers everything from basics to advanced patterns.

---

## Controlled vs Uncontrolled Inputs

### The Core Problem

In React, every \\\`setState\\\` call triggers a re-render. Traditional "controlled" forms call \\\`setState\\\` on every keystroke, which means the entire form re-renders on every character typed.

\\\`\\\`\\\`javascript
// CONTROLLED — re-renders the component on every keystroke
function ControlledForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  console.log('Form rendered'); // fires on EVERY keystroke in ANY field

  return (
    <form>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input value={password} onChange={e => setPassword(e.target.value)} />
    </form>
  );
}
\\\`\\\`\\\`

### Uncontrolled Inputs — How React Hook Form Works

React Hook Form uses **uncontrolled inputs** with \\\`ref\\\` — the DOM holds the value, not React state. No re-renders occur on keystrokes. Values are only read when needed (e.g., on submit).

\\\`\\\`\\\`javascript
// UNCONTROLLED — React Hook Form approach
import { useForm } from 'react-hook-form';

function UncontrolledForm() {
  const { register, handleSubmit } = useForm();

  console.log('Form rendered'); // only on mount and explicit re-renders

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      <input {...register('email')} />
      <input {...register('password')} />
      <button type="submit">Submit</button>
    </form>
  );
}
\\\`\\\`\\\`

### Performance Comparison

| Approach | Re-renders per keystroke | 10-field form, 50 chars typed | Library |
|----------|------------------------|-------------------------------|---------|
| Controlled (useState per field) | 1 per field | 50 re-renders | Formik |
| Controlled (single state object) | 1 (entire form) | 50 re-renders | Formik |
| Uncontrolled (ref-based) | 0 | 0 re-renders | React Hook Form |

**Interview tip:** "React Hook Form isolates re-renders. The form component doesn't re-render on input changes — only the specific field that needs to show an error re-renders, and only when validation runs."

---

## Core useForm API

### Setup and Configuration

\\\`\\\`\\\`javascript
import { useForm } from 'react-hook-form';

function MyForm() {
  const {
    register,       // connects input to RHF via ref
    handleSubmit,   // wraps your onSubmit, runs validation first
    formState: {
      errors,        // validation error objects per field
      isSubmitting,  // true while onSubmit promise is pending
      isDirty,       // true if any field differs from defaultValues
      isValid,       // true if no validation errors (requires mode)
      touchedFields, // fields the user has interacted with
      dirtyFields,   // fields that differ from defaultValues
      submitCount,   // number of times form was submitted
    },
    watch,          // subscribe to field value changes
    setValue,       // programmatically set a field value
    getValues,      // read current values without subscribing
    reset,          // reset form to defaultValues or new values
    trigger,        // manually trigger validation
    setError,       // manually set an error on a field
    clearErrors,    // clear errors for specific fields or all
    setFocus,       // programmatically focus a field
  } = useForm({
    defaultValues: {       // initial values (important for isDirty)
      name: '',
      email: '',
    },
    mode: 'onBlur',        // when validation runs: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all'
    reValidateMode: 'onChange', // when re-validation runs after first error
    criteriaMode: 'firstError', // 'firstError' | 'all' — how many errors to collect per field
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
\\\`\\\`\\\`

### The register Function

\\\`register\\\` returns an object with \\\`ref\\\`, \\\`name\\\`, \\\`onChange\\\`, and \\\`onBlur\\\` — spread it onto your input:

\\\`\\\`\\\`javascript
// What register('email') returns:
{
  name: 'email',
  ref: (element) => { /* stores DOM ref internally */ },
  onChange: (event) => { /* updates internal state, triggers validation */ },
  onBlur: (event) => { /* marks field as touched, triggers validation */ },
}

// Usage with validation rules
<input
  {...register('email', {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
  })}
/>
\\\`\\\`\\\`

### handleSubmit

\\\`handleSubmit\\\` takes two callbacks: success handler and optional error handler.

\\\`\\\`\\\`javascript
const onSubmit = async (data) => {
  // data is the validated form values
  await api.register(data);
};

const onError = (errors) => {
  // errors object — useful for analytics or focusing the first error
  console.log('Validation failed:', errors);
};

<form onSubmit={handleSubmit(onSubmit, onError)}>
\\\`\\\`\\\`

**Important:** \\\`handleSubmit\\\` prevents default form submission, runs all validation, and only calls \\\`onSubmit\\\` if validation passes.

---

## Built-In Validation Rules

React Hook Form supports validation rules directly in \\\`register\\\`:

\\\`\\\`\\\`javascript
<input
  {...register('username', {
    required: 'Username is required',
    minLength: { value: 3, message: 'Must be at least 3 characters' },
    maxLength: { value: 20, message: 'Must be 20 characters or less' },
    pattern: {
      value: /^[a-zA-Z0-9_]+$/,
      message: 'Only letters, numbers, and underscores allowed',
    },
  })}
/>

<input
  {...register('age', {
    required: 'Age is required',
    min: { value: 18, message: 'Must be at least 18' },
    max: { value: 120, message: 'Must be 120 or less' },
    valueAsNumber: true, // converts string input to number
  })}
  type="number"
/>
\\\`\\\`\\\`

### Custom Validate Functions

The \\\`validate\\\` option accepts a function or an object of functions:

\\\`\\\`\\\`javascript
<input
  {...register('password', {
    required: 'Password is required',
    minLength: { value: 8, message: 'Minimum 8 characters' },
    validate: {
      hasUppercase: (value) =>
        /[A-Z]/.test(value) || 'Must contain at least one uppercase letter',
      hasNumber: (value) =>
        /[0-9]/.test(value) || 'Must contain at least one number',
      hasSpecial: (value) =>
        /[!@#$%^&*]/.test(value) || 'Must contain a special character',
      notCommon: (value) =>
        !['password', '12345678', 'qwerty'].includes(value.toLowerCase()) ||
        'This password is too common',
    },
  })}
/>
\\\`\\\`\\\`

### Async Validation

Custom validators can be async — useful for checking username availability:

\\\`\\\`\\\`javascript
<input
  {...register('username', {
    validate: {
      available: async (value) => {
        const response = await fetch(\\\`/api/check-username/\\\${value}\\\`);
        const { available } = await response.json();
        return available || 'Username is already taken';
      },
    },
  })}
/>
\\\`\\\`\\\`

---

## Schema Validation with Yup and Zod

Schema validation separates validation logic from the UI. React Hook Form supports schemas via the \\\`@hookform/resolvers\\\` package.

### Yup Schema

\\\`\\\`\\\`javascript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be 50 characters or less'),
  email: yup
    .string()
    .required('Email is required')
    .email('Must be a valid email'),
  age: yup
    .number()
    .typeError('Age must be a number')
    .required('Age is required')
    .min(18, 'Must be at least 18')
    .max(120, 'Invalid age'),
  role: yup
    .mixed()
    .oneOf(['admin', 'editor', 'viewer'], 'Invalid role')
    .required('Role is required'),
  website: yup
    .string()
    .url('Must be a valid URL')
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[0-9]/, 'Must contain a number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

function YupForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '', email: '', age: '', role: '',
      website: '', password: '', confirmPassword: '',
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... other fields */}
    </form>
  );
}
\\\`\\\`\\\`

### Zod Schema

Zod is TypeScript-first and provides automatic type inference:

\\\`\\\`\\\`javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be 50 characters or less'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email'),
  age: z
    .number({ invalid_type_error: 'Age must be a number' })
    .min(18, 'Must be at least 18')
    .max(120, 'Invalid age'),
  role: z.enum(['admin', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'Select a valid role' }),
  }),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'], // attach error to confirmPassword field
});

// TypeScript: infer the form type from the schema
// type FormData = z.infer<typeof schema>;

function ZodForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... other fields */}
    </form>
  );
}
\\\`\\\`\\\`

### Yup vs Zod Comparison

| Feature | Yup | Zod |
|---------|-----|-----|
| **TypeScript** | Manual types or \\\`InferType\\\` | First-class \\\`z.infer<typeof schema>\\\` |
| **Bundle size** | ~12 KB | ~8 KB |
| **Cross-field validation** | \\\`.oneOf([ref('field')])\\\` | \\\`.refine()\\\` or \\\`.superRefine()\\\` |
| **Conditional validation** | \\\`.when('field', { is, then, otherwise })\\\` | \\\`.refine()\\\` with custom logic |
| **Coercion** | Built-in transforms | \\\`z.coerce.number()\\\` |
| **Ecosystem** | Mature, widely adopted | Growing fast, TypeScript community favorite |

**Interview tip:** "I prefer Zod for TypeScript projects because it provides full type inference from the schema — the form type and validation logic are always in sync."

---

## Dynamic Fields with useFieldArray

\\\`useFieldArray\\\` manages arrays of fields — perfect for line items, team members, or any repeating group:

\\\`\\\`\\\`javascript
import { useForm, useFieldArray } from 'react-hook-form';

function TeamForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      teamName: '',
      members: [{ name: '', email: '' }], // start with one member
    },
  });

  const { fields, append, remove, move, swap, insert, prepend } = useFieldArray({
    control,   // pass control from useForm
    name: 'members', // the field array name
  });

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('teamName', { required: 'Team name is required' })} />

      {fields.map((field, index) => (
        <div key={field.id}> {/* MUST use field.id, not index */}
          <input
            {...register(\\\`members.\\\${index}.name\\\`, { required: 'Name is required' })}
            placeholder="Member name"
          />
          {errors.members?.[index]?.name && (
            <span>{errors.members[index].name.message}</span>
          )}

          <input
            {...register(\\\`members.\\\${index}.email\\\`, {
              required: 'Email is required',
              pattern: { value: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, message: 'Invalid email' },
            })}
            placeholder="Email"
          />
          {errors.members?.[index]?.email && (
            <span>{errors.members[index].email.message}</span>
          )}

          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={() => append({ name: '', email: '' })}>
        Add Member
      </button>
      <button type="submit">Submit</button>
    </form>
  );
}
\\\`\\\`\\\`

**Critical:** Always use \\\`field.id\\\` as the \\\`key\\\`, not the array index. React Hook Form generates stable IDs to prevent input value mixing when items are reordered or removed.

### useFieldArray Operations

| Method | Purpose | Example |
|--------|---------|---------|
| \\\`append(obj)\\\` | Add to end | \\\`append({ name: '' })\\\` |
| \\\`prepend(obj)\\\` | Add to beginning | \\\`prepend({ name: '' })\\\` |
| \\\`insert(index, obj)\\\` | Insert at position | \\\`insert(2, { name: '' })\\\` |
| \\\`remove(index)\\\` | Remove at position | \\\`remove(1)\\\` |
| \\\`swap(from, to)\\\` | Swap two items | \\\`swap(0, 2)\\\` |
| \\\`move(from, to)\\\` | Move item to position | \\\`move(0, 3)\\\` |
| \\\`update(index, obj)\\\` | Replace item at index | \\\`update(1, { name: 'New' })\\\` |
| \\\`replace(arr)\\\` | Replace entire array | \\\`replace([{ name: 'A' }])\\\` |

---

## Programmatic Control: watch, setValue, reset, trigger

### watch — Subscribe to Field Values

\\\`\\\`\\\`javascript
const { register, watch } = useForm();

// Watch a single field (triggers re-render on change)
const email = watch('email');

// Watch multiple fields
const [name, age] = watch(['name', 'age']);

// Watch all fields
const allValues = watch();

// Watch with callback (no re-render — side-effect only)
useEffect(() => {
  const subscription = watch((values, { name, type }) => {
    console.log('Field changed:', name, type, values);
  });
  return () => subscription.unsubscribe();
}, [watch]);
\\\`\\\`\\\`

**Use case:** Show/hide fields conditionally based on another field's value.

\\\`\\\`\\\`javascript
const hasCompany = watch('hasCompany');

return (
  <>
    <input type="checkbox" {...register('hasCompany')} />
    {hasCompany && (
      <input
        {...register('companyName', { required: 'Company name required' })}
        placeholder="Company name"
      />
    )}
  </>
);
\\\`\\\`\\\`

### setValue — Programmatic Value Updates

\\\`\\\`\\\`javascript
const { setValue } = useForm();

// Set value with validation and dirty tracking
setValue('address', '123 Main St', {
  shouldValidate: true,  // trigger validation
  shouldDirty: true,     // mark as dirty
  shouldTouch: true,     // mark as touched
});

// Common use case: populating form from API data
useEffect(() => {
  async function loadProfile() {
    const profile = await fetchProfile(userId);
    setValue('name', profile.name);
    setValue('email', profile.email);
    setValue('bio', profile.bio);
  }
  loadProfile();
}, [userId, setValue]);
\\\`\\\`\\\`

### reset — Reset Form State

\\\`\\\`\\\`javascript
const { reset, handleSubmit } = useForm({
  defaultValues: { name: '', email: '' },
});

// Reset to default values
const handleReset = () => reset();

// Reset to new values (useful after successful API save)
const onSubmit = async (data) => {
  const saved = await api.saveProfile(data);
  reset(saved); // form is now "pristine" with the saved data as defaults
};

// Reset specific state
reset(undefined, {
  keepErrors: true,       // keep current errors
  keepDirty: true,        // keep dirty state
  keepValues: true,       // keep current values
  keepTouched: true,      // keep touched state
  keepIsSubmitted: false, // reset submit count
});
\\\`\\\`\\\`

### trigger — Manual Validation

\\\`\\\`\\\`javascript
const { trigger } = useForm();

// Validate all fields
await trigger();

// Validate specific field
const isEmailValid = await trigger('email');

// Validate multiple fields
const areValid = await trigger(['email', 'password']);

// Use case: validate current step before proceeding in a wizard
const handleNextStep = async () => {
  const isValid = await trigger(['firstName', 'lastName', 'email']);
  if (isValid) setStep(step + 1);
};
\\\`\\\`\\\`

---

## Error Handling and Accessibility

### Displaying Errors

\\\`\\\`\\\`javascript
function AccessibleInput({ name, label, register, errors, rules }) {
  const error = errors[name];
  const inputId = \\\`field-\\\${name}\\\`;
  const errorId = \\\`error-\\\${name}\\\`;

  return (
    <div>
      <label htmlFor={inputId}>
        {label}
        {rules?.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={inputId}
        {...register(name, rules)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        aria-required={rules?.required ? 'true' : undefined}
      />
      {error && (
        <span id={errorId} role="alert" style={{ color: 'red' }}>
          {error.message}
        </span>
      )}
    </div>
  );
}
\\\`\\\`\\\`

### Key Accessibility Attributes

| Attribute | Purpose |
|-----------|---------|
| \\\`aria-invalid="true"\\\` | Tells screen readers the field has an error |
| \\\`aria-describedby="error-id"\\\` | Links the input to its error message |
| \\\`aria-required="true"\\\` | Announces the field is required |
| \\\`role="alert"\\\` | Causes screen readers to announce the error immediately (live region) |

### Focus Management on Errors

React Hook Form can auto-focus the first field with an error:

\\\`\\\`\\\`javascript
const { handleSubmit } = useForm({
  shouldFocusError: true, // default: true — focuses first invalid field on submit
});
\\\`\\\`\\\`

For manual focus management:

\\\`\\\`\\\`javascript
const { setFocus } = useForm();

// Focus a specific field
useEffect(() => {
  setFocus('email');
}, [setFocus]);

// Focus first error after submit
const onError = (errors) => {
  const firstErrorField = Object.keys(errors)[0];
  setFocus(firstErrorField);
};

<form onSubmit={handleSubmit(onSubmit, onError)}>
\\\`\\\`\\\`

---

## Multi-Step / Wizard Forms

Wizard forms split a long form into digestible steps. The key challenge is managing validation per step while preserving values across steps.

### Approach: Single useForm with Step-Based Validation

\\\`\\\`\\\`javascript
import { useForm } from 'react-hook-form';
import { useState } from 'react';

function WizardForm() {
  const [step, setStep] = useState(0);
  const { register, handleSubmit, trigger, formState: { errors } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      // Step 0
      firstName: '', lastName: '', email: '',
      // Step 1
      street: '', city: '', zipCode: '',
      // Step 2
      cardNumber: '', expiry: '', cvv: '',
    },
  });

  const stepFields = [
    ['firstName', 'lastName', 'email'],
    ['street', 'city', 'zipCode'],
    ['cardNumber', 'expiry', 'cvv'],
  ];

  const handleNext = async () => {
    const isValid = await trigger(stepFields[step]);
    if (isValid) setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const onSubmit = (data) => {
    console.log('Final submission:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {step === 0 && (
        <div>
          <h2>Personal Info</h2>
          <input {...register('firstName', { required: 'Required' })} />
          <input {...register('lastName', { required: 'Required' })} />
          <input {...register('email', { required: 'Required',
            pattern: { value: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, message: 'Invalid' }
          })} />
        </div>
      )}

      {step === 1 && (
        <div>
          <h2>Address</h2>
          <input {...register('street', { required: 'Required' })} />
          <input {...register('city', { required: 'Required' })} />
          <input {...register('zipCode', { required: 'Required',
            pattern: { value: /^\\d{5}(-\\d{4})?$/, message: 'Invalid ZIP' }
          })} />
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Payment</h2>
          <input {...register('cardNumber', { required: 'Required' })} />
          <input {...register('expiry', { required: 'Required' })} />
          <input {...register('cvv', { required: 'Required',
            minLength: { value: 3, message: 'Min 3 digits' }
          })} />
        </div>
      )}

      <div>
        {step > 0 && <button type="button" onClick={handleBack}>Back</button>}
        {step < 2 && <button type="button" onClick={handleNext}>Next</button>}
        {step === 2 && <button type="submit">Submit Order</button>}
      </div>
    </form>
  );
}
\\\`\\\`\\\`

---

## File Uploads with Forms

\\\`\\\`\\\`javascript
import { useForm } from 'react-hook-form';

function FileUploadForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const selectedFile = watch('avatar');

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('avatar', data.avatar[0]); // FileList -> single File

    await fetch('/api/upload', {
      method: 'POST',
      body: formData, // no Content-Type header — browser sets multipart boundary
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name', { required: 'Name is required' })} />

      <input
        type="file"
        accept="image/*"
        {...register('avatar', {
          required: 'Avatar is required',
          validate: {
            fileSize: (files) =>
              !files[0] || files[0].size <= 5_000_000 || 'Max file size is 5MB',
            fileType: (files) =>
              !files[0] ||
              ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type) ||
              'Only JPEG, PNG, or WebP allowed',
          },
        })}
      />
      {errors.avatar && <span role="alert">{errors.avatar.message}</span>}

      {selectedFile?.[0] && (
        <img
          src={URL.createObjectURL(selectedFile[0])}
          alt="Preview"
          style={{ width: 100, height: 100, objectFit: 'cover' }}
        />
      )}

      <button type="submit">Upload</button>
    </form>
  );
}
\\\`\\\`\\\`

---

## Form Performance: React Hook Form vs Formik

### Why React Hook Form Is Faster

| Factor | Formik | React Hook Form |
|--------|--------|-----------------|
| **Input approach** | Controlled (state per keystroke) | Uncontrolled (ref-based) |
| **Re-renders on typing** | Entire form re-renders | Zero re-renders |
| **Validation trigger** | On every change (default) | Configurable (onSubmit, onBlur, etc.) |
| **Error display** | Re-renders form to update errors | Only the errored field re-renders |
| **Bundle size** | ~13 KB (+ Yup ~12 KB) | ~9 KB (+ Zod ~8 KB) |
| **Mounting speed** | Slower (controlled setup per field) | Faster (ref attachment only) |

\\\`\\\`\\\`
Re-renders during form interaction (10-field form):

Formik:          ████████████████████████████████ (32 re-renders for 10 keystrokes)
React Hook Form: ██ (2 re-renders — mount + submit)
\\\`\\\`\\\`

**Interview answer:** "React Hook Form achieves near-zero re-renders by embracing uncontrolled inputs and using refs to communicate with the DOM directly. Validation and error states are isolated — only the component displaying an error for a specific field needs to re-render, not the entire form."

---

## Common Interview Questions

1. **"What's the difference between controlled and uncontrolled inputs?"** — Controlled inputs store their value in React state and update on every change via \\\`onChange\\\`. Uncontrolled inputs let the DOM hold the value and read it via refs. React Hook Form uses uncontrolled inputs for performance.

2. **"How does React Hook Form avoid re-renders?"** — By using refs instead of state for input values. The form component doesn't re-render on keystrokes. Only error display components re-render, and only when their specific field's validation state changes.

3. **"Yup vs Zod — which do you prefer and why?"** — Zod for TypeScript projects because \\\`z.infer<typeof schema>\\\` provides type safety automatically. The schema IS the type definition. Yup for JavaScript projects or teams already using it with broader ecosystem support.

4. **"How do you handle cross-field validation?"** — In Zod, use \\\`.refine()\\\` on the parent object: \\\`schema.refine(data => data.password === data.confirmPassword, { path: ['confirmPassword'] })\\\`. In Yup, use \\\`.oneOf([yup.ref('password')])\\\`.

5. **"How do you make forms accessible?"** — Use \\\`aria-invalid\\\` on inputs with errors, \\\`aria-describedby\\\` linking to the error message element, \\\`aria-required\\\` for required fields, \\\`role="alert"\\\` on error messages for screen reader announcements, and configure \\\`shouldFocusError: true\\\` to auto-focus the first invalid field.

6. **"How do you handle multi-step forms?"** — Use a single \\\`useForm\\\` instance to maintain state across steps. Each step validates only its own fields using \\\`trigger(['field1', 'field2'])\\\` before advancing. This preserves all values without external state management.

7. **"Explain useFieldArray."** — It manages dynamic field arrays (add/remove/reorder). Key rules: always use \\\`field.id\\\` as the React key (not index), pass \\\`control\\\` from useForm, and use the dot-notation path for nested register calls like \\\`register(\\\\\\\`items.\\\\\\\${index}.name\\\\\\\`)\\\`.

8. **"When would you use watch vs getValues?"** — \\\`watch\\\` subscribes to value changes and triggers re-renders — use it when UI depends on a field's value (conditional rendering). \\\`getValues\\\` reads values without subscribing — use it in event handlers or effects where you just need the current value without re-rendering.
    `,
  },
];

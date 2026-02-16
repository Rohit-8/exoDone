// ============================================================================
// Forms & Validation — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  "react-hook-form": [
    {
      title: "Registration Form with Zod Schema Validation",
      description:
        "A complete registration form using React Hook Form with Zod schema-based validation, demonstrating zodResolver integration, cross-field password confirmation with .refine(), accessible error display with aria attributes, and async form submission with loading state.",
      language: "javascript",
      code: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── 1. Define Zod schema with cross-field validation ──
const registrationSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be 20 characters or less')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    age: z.coerce          // coerce converts string input to number
      .number({ invalid_type_error: 'Age must be a number' })
      .min(18, 'You must be at least 18 years old')
      .max(120, 'Please enter a valid age'),
    role: z.enum(['developer', 'designer', 'manager', 'other'], {
      errorMap: () => ({ message: 'Please select a role' }),
    }),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[!@#$%^&*]/, 'Must contain at least one special character (!@#$%^&*)'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // attach error to confirmPassword field
  });

// TypeScript: type FormData = z.infer<typeof registrationSchema>;

// ── 2. Reusable accessible input component ──
function FormField({ label, name, type = 'text', register, errors, ...rest }) {
  const error = errors[name];
  const inputId = \`field-\${name}\`;
  const errorId = \`error-\${name}\`;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={inputId} style={{ display: 'block', fontWeight: 600 }}>
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        {...register(name)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: error ? '2px solid #e53e3e' : '1px solid #ccc',
          borderRadius: '4px',
        }}
        {...rest}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ color: '#e53e3e', fontSize: '0.85rem' }}
        >
          {error.message}
        </span>
      )}
    </div>
  );
}

// ── 3. Registration form component ──
function RegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    reset,
    setError,
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: '',
      email: '',
      age: '',
      role: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onTouched', // validate on blur, re-validate on change
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          age: data.age,
          role: data.role,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Server-side validation errors (e.g., username taken)
        if (errorData.field) {
          setError(errorData.field, { message: errorData.message });
          return;
        }
        throw new Error(errorData.message || 'Registration failed');
      }

      alert('Registration successful!');
      reset(); // clear form after success
    } catch (err) {
      setError('root', { message: err.message }); // form-level error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2>Create Account</h2>

      {/* Form-level error (e.g., network failure) */}
      {errors.root && (
        <div role="alert" style={{ color: '#e53e3e', marginBottom: '1rem' }}>
          {errors.root.message}
        </div>
      )}

      <FormField label="Username" name="username" register={register} errors={errors} />
      <FormField label="Email" name="email" type="email" register={register} errors={errors} />
      <FormField label="Age" name="age" type="number" register={register} errors={errors} />

      {/* Select field */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="field-role" style={{ display: 'block', fontWeight: 600 }}>Role</label>
        <select
          id="field-role"
          {...register('role')}
          aria-invalid={errors.role ? 'true' : 'false'}
        >
          <option value="">Select a role...</option>
          <option value="developer">Developer</option>
          <option value="designer">Designer</option>
          <option value="manager">Manager</option>
          <option value="other">Other</option>
        </select>
        {errors.role && (
          <span role="alert" style={{ color: '#e53e3e', fontSize: '0.85rem' }}>
            {errors.role.message}
          </span>
        )}
      </div>

      <FormField label="Password" name="password" type="password" register={register} errors={errors} />
      <FormField label="Confirm Password" name="confirmPassword" type="password" register={register} errors={errors} />

      {/* Checkbox */}
      <div style={{ marginBottom: '1rem' }}>
        <label>
          <input type="checkbox" {...register('acceptTerms')} />
          {' '}I accept the terms and conditions
        </label>
        {errors.acceptTerms && (
          <span role="alert" style={{ color: '#e53e3e', display: 'block', fontSize: '0.85rem' }}>
            {errors.acceptTerms.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '0.75rem 1.5rem',
          background: isSubmitting ? '#999' : '#3182ce',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'Creating Account...' : 'Register'}
      </button>
    </form>
  );
}`,
      explanation:
        "This example demonstrates: (1) Zod schema with z.object, z.string, z.coerce.number, z.enum, z.literal for terms checkbox, and .refine() for cross-field password matching, (2) zodResolver integration with useForm, (3) accessible error display using aria-invalid, aria-describedby, and role='alert', (4) server-side error handling with setError for field-level and root-level errors, (5) form state management with isSubmitting for loading UX, and (6) a reusable FormField component pattern.",
      order_index: 1,
    },
    {
      title: "Dynamic Invoice Line Items with useFieldArray",
      description:
        "An invoice form with dynamic line items using useFieldArray, demonstrating append/remove/move operations, per-row validation, computed totals with watch, and Zod schema validation for the entire field array.",
      language: "javascript",
      code: `import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo } from 'react';

// ── 1. Schema with array validation ──
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Min 1').max(9999, 'Max 9999'),
  unitPrice: z.coerce.number().min(0.01, 'Min $0.01').max(999999, 'Max $999,999'),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  items: z
    .array(lineItemSchema)
    .min(1, 'At least one line item is required')
    .max(50, 'Maximum 50 line items'),
});

// ── 2. Invoice form component ──
function InvoiceForm() {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      dueDate: '',
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  // ── useFieldArray for dynamic line items ──
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items',
  });

  // ── Watch all items to compute totals ──
  const watchedItems = watch('items');

  const totals = useMemo(() => {
    if (!watchedItems) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = watchedItems.reduce((sum, item) => {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
    const tax = subtotal * 0.1; // 10% tax
    return { subtotal, tax, total: subtotal + tax };
  }, [watchedItems]);

  const onSubmit = async (data) => {
    // Enrich with computed totals
    const invoice = {
      ...data,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
    };
    console.log('Invoice submitted:', invoice);
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>Create Invoice</h2>

      {/* ── Client details ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label>Client Name</label>
          <input {...register('clientName')} />
          {errors.clientName && <span role="alert">{errors.clientName.message}</span>}
        </div>
        <div>
          <label>Client Email</label>
          <input type="email" {...register('clientEmail')} />
          {errors.clientEmail && <span role="alert">{errors.clientEmail.message}</span>}
        </div>
        <div>
          <label>Due Date</label>
          <input type="date" {...register('dueDate')} />
          {errors.dueDate && <span role="alert">{errors.dueDate.message}</span>}
        </div>
      </div>

      {/* ── Dynamic line items ── */}
      <h3 style={{ marginTop: '1.5rem' }}>Line Items</h3>

      {/* Array-level error */}
      {errors.items?.root && (
        <span role="alert" style={{ color: '#e53e3e' }}>
          {errors.items.root.message}
        </span>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Line Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => {
            const qty = Number(watchedItems?.[index]?.quantity) || 0;
            const price = Number(watchedItems?.[index]?.unitPrice) || 0;
            const lineTotal = qty * price;

            return (
              <tr key={field.id}> {/* Always use field.id, never index */}
                <td>{index + 1}</td>
                <td>
                  <input
                    {...register(\`items.\${index}.description\`)}
                    placeholder="Item description"
                    aria-invalid={errors.items?.[index]?.description ? 'true' : 'false'}
                  />
                  {errors.items?.[index]?.description && (
                    <span role="alert" style={{ color: '#e53e3e', fontSize: '0.8rem' }}>
                      {errors.items[index].description.message}
                    </span>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    {...register(\`items.\${index}.quantity\`)}
                    style={{ width: '80px' }}
                    min="1"
                  />
                  {errors.items?.[index]?.quantity && (
                    <span role="alert" style={{ color: '#e53e3e', fontSize: '0.8rem' }}>
                      {errors.items[index].quantity.message}
                    </span>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    {...register(\`items.\${index}.unitPrice\`)}
                    style={{ width: '120px' }}
                  />
                  {errors.items?.[index]?.unitPrice && (
                    <span role="alert" style={{ color: '#e53e3e', fontSize: '0.8rem' }}>
                      {errors.items[index].unitPrice.message}
                    </span>
                  )}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  \${lineTotal.toFixed(2)}
                </td>
                <td>
                  {index > 0 && (
                    <button type="button" onClick={() => move(index, index - 1)} title="Move up">
                      ↑
                    </button>
                  )}
                  {index < fields.length - 1 && (
                    <button type="button" onClick={() => move(index, index + 1)} title="Move down">
                      ↓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    title="Remove item"
                    style={{ color: '#e53e3e' }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        type="button"
        onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
        style={{ marginTop: '0.5rem' }}
      >
        + Add Line Item
      </button>

      {/* ── Totals ── */}
      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <p>Subtotal: <strong>\${totals.subtotal.toFixed(2)}</strong></p>
        <p>Tax (10%): <strong>\${totals.tax.toFixed(2)}</strong></p>
        <p style={{ fontSize: '1.2rem' }}>
          Total: <strong>\${totals.total.toFixed(2)}</strong>
        </p>
      </div>

      {/* ── Notes ── */}
      <div style={{ marginTop: '1rem' }}>
        <label>Notes (optional)</label>
        <textarea {...register('notes')} rows={3} style={{ width: '100%' }} />
        {errors.notes && <span role="alert">{errors.notes.message}</span>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ marginTop: '1rem', padding: '0.75rem 2rem' }}
      >
        {isSubmitting ? 'Sending...' : 'Send Invoice'}
      </button>
    </form>
  );
}`,
      explanation:
        "This example demonstrates: (1) useFieldArray with append, remove, and move operations for dynamic invoice line items, (2) Zod array validation with .min(1) and .max(50) constraints on the items array, (3) per-row validation errors accessed via errors.items?.[index]?.fieldName, (4) watch('items') combined with useMemo to compute live subtotals, tax, and grand total as the user types, (5) always using field.id (never array index) as the React key to prevent value mixing during reorder/removal, and (6) dot-notation register paths like register(`items.${index}.description`) for nested fields.",
      order_index: 2,
    },
    {
      title: "Multi-Step Wizard Form with Per-Step Validation and Progress",
      description:
        "A three-step checkout wizard using a single useForm instance, demonstrating per-step field validation with trigger(), step navigation with progress indicator, conditional field rendering, data summary before final submission, and reset after success.",
      language: "javascript",
      code: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

// ── 1. Full schema covering all steps ──
const checkoutSchema = z.object({
  // Step 1: Personal Info
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  phone: z.string().regex(/^\\+?[\\d\\s()-]{7,15}$/, 'Invalid phone number'),

  // Step 2: Shipping Address
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().regex(/^\\d{5}(-\\d{4})?$/, 'Invalid ZIP code'),
  country: z.string().min(1, 'Country is required'),

  // Step 3: Payment
  cardholderName: z.string().min(1, 'Cardholder name is required'),
  cardNumber: z
    .string()
    .regex(/^\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}$/, 'Invalid card number'),
  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\\/\\d{2}$/, 'Use MM/YY format'),
  cvv: z.string().regex(/^\\d{3,4}$/, 'Invalid CVV'),
});

// ── 2. Step configuration ──
const STEPS = [
  {
    title: 'Personal Info',
    description: 'Tell us about yourself',
    fields: ['firstName', 'lastName', 'email', 'phone'],
  },
  {
    title: 'Shipping Address',
    description: 'Where should we deliver?',
    fields: ['street', 'city', 'state', 'zipCode', 'country'],
  },
  {
    title: 'Payment',
    description: 'Complete your purchase',
    fields: ['cardholderName', 'cardNumber', 'expiryDate', 'cvv'],
  },
];

// ── 3. Progress bar component ──
function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div style={{ display: 'flex', marginBottom: '2rem' }}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: i <= currentStep ? '#3182ce' : '#e2e8f0',
              color: i <= currentStep ? '#fff' : '#718096',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
            aria-current={i === currentStep ? 'step' : undefined}
          >
            {i < currentStep ? '✓' : i + 1}
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {STEPS[i].title}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 4. Wizard form component ──
function CheckoutWizard() {
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      street: '', city: '', state: '', zipCode: '', country: '',
      cardholderName: '', cardNumber: '', expiryDate: '', cvv: '',
    },
    mode: 'onTouched',
  });

  // Validate only current step's fields before advancing
  const handleNext = async () => {
    const currentFields = STEPS[step].fields;
    const isValid = await trigger(currentFields);
    if (isValid) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const onSubmit = async (data) => {
    try {
      await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setIsComplete(true);
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  const handleStartOver = () => {
    reset();
    setStep(0);
    setIsComplete(false);
  };

  // ── Success screen ──
  if (isComplete) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Order Placed!</h2>
        <p>Thank you, {getValues('firstName')}! Check {getValues('email')} for confirmation.</p>
        <button onClick={handleStartOver}>Place Another Order</button>
      </div>
    );
  }

  // ── Form field renderer (reduces repetition) ──
  function Field({ name, label, type = 'text', ...rest }) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor={name} style={{ display: 'block', fontWeight: 600 }}>
          {label}
        </label>
        <input
          id={name}
          type={type}
          {...register(name)}
          aria-invalid={errors[name] ? 'true' : 'false'}
          aria-describedby={errors[name] ? \`err-\${name}\` : undefined}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: errors[name] ? '2px solid #e53e3e' : '1px solid #ccc',
            borderRadius: '4px',
          }}
          {...rest}
        />
        {errors[name] && (
          <span id={\`err-\${name}\`} role="alert" style={{ color: '#e53e3e', fontSize: '0.85rem' }}>
            {errors[name].message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>Checkout</h2>
      <ProgressBar currentStep={step} totalSteps={STEPS.length} />

      <h3>{STEPS[step].title}</h3>
      <p style={{ color: '#718096' }}>{STEPS[step].description}</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Personal Info */}
        {step === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field name="firstName" label="First Name" />
              <Field name="lastName" label="Last Name" />
            </div>
            <Field name="email" label="Email" type="email" />
            <Field name="phone" label="Phone" type="tel" placeholder="+1 (555) 123-4567" />
          </div>
        )}

        {/* Step 2: Shipping Address */}
        {step === 1 && (
          <div>
            <Field name="street" label="Street Address" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field name="city" label="City" />
              <Field name="state" label="State" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field name="zipCode" label="ZIP Code" placeholder="12345" />
              <Field name="country" label="Country" />
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 2 && (
          <div>
            <Field name="cardholderName" label="Cardholder Name" />
            <Field name="cardNumber" label="Card Number" placeholder="1234 5678 9012 3456" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field name="expiryDate" label="Expiry Date" placeholder="MM/YY" />
              <Field name="cvv" label="CVV" placeholder="123" />
            </div>

            {/* Order summary before final submit */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f7fafc',
              borderRadius: '8px',
            }}>
              <h4>Order Summary</h4>
              <p><strong>Name:</strong> {getValues('firstName')} {getValues('lastName')}</p>
              <p><strong>Email:</strong> {getValues('email')}</p>
              <p>
                <strong>Ship to:</strong>{' '}
                {getValues('street')}, {getValues('city')}, {getValues('state')} {getValues('zipCode')}
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          {step > 0 ? (
            <button type="button" onClick={handleBack}>
              ← Back
            </button>
          ) : (
            <div /> /* spacer */
          )}

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={handleNext}>
              Next →
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </button>
          )}
        </div>

        {/* Step indicator for screen readers */}
        <p aria-live="polite" className="sr-only">
          Step {step + 1} of {STEPS.length}: {STEPS[step].title}
        </p>
      </form>
    </div>
  );
}`,
      explanation:
        "This example demonstrates the multi-step wizard pattern: (1) a single useForm instance holds ALL step data — values persist as the user navigates back and forth, (2) trigger(stepFields) validates only the current step's fields before allowing navigation to the next step, (3) a STEPS configuration array maps step metadata to field names for clean step management, (4) getValues() is used on the final step to show an order summary without triggering re-renders, (5) reset() clears all form state after successful submission, (6) a ProgressBar component with aria-current='step' provides visual and accessible step indicators, and (7) aria-live='polite' announces step changes to screen readers. This approach avoids the complexity of managing form state in external stores or passing data between separate forms.",
      order_index: 3,
    },
  ],
};

export default examples;

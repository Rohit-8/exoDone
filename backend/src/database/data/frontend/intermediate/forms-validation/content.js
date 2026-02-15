// ============================================================================
// Forms & Validation — Content
// ============================================================================

export const topic = {
  "name": "Forms & Validation",
  "slug": "forms-validation",
  "description": "Build performant, accessible forms with React Hook Form and schema-based validation using Yup/Zod.",
  "estimated_time": 160,
  "order_index": 5
};

export const lessons = [
  {
    title: "React Hook Form & Validation Schemas",
    slug: "react-hook-form",
    summary: "Build performant forms with React Hook Form and validate with Yup/Zod schemas.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "React Hook Form uses uncontrolled inputs for better performance",
  "register() connects inputs to the form state",
  "Yup and Zod schemas provide declarative validation rules",
  "useFieldArray handles dynamic form fields",
  "handleSubmit only fires when validation passes"
],
    content: `# React Hook Form & Validation

## Why React Hook Form?
- **Performance**: Uses uncontrolled inputs — minimal re-renders
- **DX**: Simple API with register, handleSubmit, formState
- **Validation**: Integrates with Yup, Zod, Joi via resolvers

## Basic Setup

\`\`\`bash
npm install react-hook-form @hookform/resolvers yup
\`\`\`

\`\`\`jsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Min 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  age: yup.number().positive().integer().min(18, 'Must be at least 18'),
  password: yup.string().min(8, 'Min 8 characters')
    .matches(/[A-Z]/, 'Need one uppercase')
    .matches(/[0-9]/, 'Need one number')
    .required(),
});

function SignUpForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    await api.register(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Name" />
      {errors.name && <p className="error">{errors.name.message}</p>}

      <input {...register('email')} placeholder="Email" />
      {errors.email && <p className="error">{errors.email.message}</p>}

      <input type="number" {...register('age')} placeholder="Age" />
      {errors.age && <p className="error">{errors.age.message}</p>}

      <input type="password" {...register('password')} placeholder="Password" />
      {errors.password && <p className="error">{errors.password.message}</p>}

      <button disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Sign Up'}</button>
    </form>
  );
}
\`\`\`
`,
  },
];

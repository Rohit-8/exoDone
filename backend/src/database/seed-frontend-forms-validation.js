import pool from '../config/database.js';

async function seedFormsValidation() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding Forms & Validation lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'forms-validation'");
    
    if (topicsResult.rows.length === 0) {
      console.log('❌ Topic not found: forms-validation');
      await client.query('ROLLBACK');
      return;
    }
    
    const topicId = topicsResult.rows[0].id;

    const existingLesson = await client.query(
      "SELECT id FROM lessons WHERE topic_id = $1 AND slug = 'react-forms-validation'",
      [topicId]
    );

    if (existingLesson.rows.length > 0) {
      console.log('⚠️  Lesson already exists: react-forms-validation');
      await client.query('ROLLBACK');
      return;
    }

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'React Forms & Validation: React Hook Form & Formik', 'react-forms-validation', $2, 'Master form handling in React with React Hook Form and Formik. Learn schema validation with Yup, form state management, and building complex forms.', 'intermediate', 55, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# React Forms & Validation: React Hook Form & Formik

## Introduction to Form Handling

Forms are crucial for user input in web applications. React provides multiple approaches for managing form state and validation.

### Common Form Challenges

❌ **State Management**: Tracking multiple field values
❌ **Validation**: Real-time and submit-time validation
❌ **Error Handling**: Displaying and managing error messages
❌ **Performance**: Re-rendering on every keystroke
❌ **Complex Forms**: Nested fields, arrays, conditional fields
❌ **File Uploads**: Handling file inputs
❌ **Accessibility**: ARIA labels and error announcements

### Form Library Comparison

**React Hook Form**
✅ Minimal re-renders (uncontrolled inputs)
✅ Excellent performance
✅ Small bundle size (9kb)
✅ Built-in validation
✅ Easy integration with UI libraries

**Formik**
✅ Full-featured solution
✅ Familiar API
✅ Large ecosystem
✅ Good documentation
❌ More re-renders (controlled inputs)
❌ Larger bundle (15kb)

## React Hook Form

### Installation

\\\`\\\`\\\`bash
npm install react-hook-form
npm install @hookform/resolvers yup
\\\`\\\`\\\`

### Basic Form

\\\`\\\`\\\`jsx
import { useForm } from 'react-hook-form';

function LoginForm() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm();

  const onSubmit = async (data) => {
    console.log(data);
    // { email: 'user@example.com', password: 'password123' }
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        console.log('Login successful!');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
        />
        {errors.email && (
          <span className="error">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            }
          })}
        />
        {errors.password && (
          <span className="error">{errors.password.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
\\\`\\\`\\\`

### Validation with Yup

\\\`\\\`\\\`jsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Define validation schema
const registerSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  
  age: yup
    .number()
    .required('Age is required')
    .positive('Age must be positive')
    .integer('Age must be a whole number')
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Please enter a valid age'),
  
  terms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions'),
}).required();

function RegisterForm() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onBlur', // Validate on blur
  });

  const onSubmit = async (data) => {
    console.log('Form data:', data);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        console.log('Registration successful!');
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Username</label>
        <input {...register('username')} />
        {errors.username && <span className="error">{errors.username.message}</span>}
      </div>

      <div>
        <label>Email</label>
        <input type="email" {...register('email')} />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      <div>
        <label>Password</label>
        <input type="password" {...register('password')} />
        {errors.password && <span className="error">{errors.password.message}</span>}
      </div>

      <div>
        <label>Confirm Password</label>
        <input type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
      </div>

      <div>
        <label>Age</label>
        <input type="number" {...register('age')} />
        {errors.age && <span className="error">{errors.age.message}</span>}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('terms')} />
          I accept the terms and conditions
        </label>
        {errors.terms && <span className="error">{errors.terms.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Register'}
      </button>
    </form>
  );
}
\\\`\\\`\\\`

### Advanced React Hook Form Features

\\\`\\\`\\\`jsx
import { useForm, useWatch, useFieldArray, Controller } from 'react-hook-form';

function AdvancedForm() {
  const { 
    register, 
    handleSubmit, 
    control,
    watch,
    reset,
    setValue,
    getValues,
    trigger,
    formState: { errors, isDirty, isValid, dirtyFields } 
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      subscribe: false,
      notifications: 'email',
      tags: ['react', 'javascript'],
      social: [
        { platform: 'twitter', url: '' }
      ]
    },
    mode: 'onChange' // Validate on change
  });

  // Watch specific field
  const subscribe = watch('subscribe');
  
  // Watch multiple fields
  const [firstName, lastName] = watch(['firstName', 'lastName']);

  // Use useWatch for better performance
  const watchedEmail = useWatch({ control, name: 'email' });

  // Dynamic field array
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'social'
  });

  const onSubmit = (data) => {
    console.log('Form data:', data);
  };

  const handleReset = () => {
    reset(); // Reset to default values
  };

  const handleFill = () => {
    setValue('firstName', 'John');
    setValue('lastName', 'Doe');
    setValue('email', 'john@example.com');
    trigger(); // Trigger validation
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('firstName', { required: true })} placeholder="First Name" />
        {errors.firstName && <span>First name is required</span>}
      </div>

      <div>
        <input {...register('lastName', { required: true })} placeholder="Last Name" />
        {errors.lastName && <span>Last name is required</span>}
      </div>

      <div>
        <input {...register('email', { required: true })} placeholder="Email" />
        {errors.email && <span>Email is required</span>}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('subscribe')} />
          Subscribe to newsletter
        </label>
      </div>

      {/* Conditional field */}
      {subscribe && (
        <div>
          <label>Notification Preference</label>
          <select {...register('notifications')}>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Both</option>
          </select>
        </div>
      )}

      {/* Dynamic field array */}
      <div>
        <h3>Social Media</h3>
        {fields.map((field, index) => (
          <div key={field.id}>
            <input
              {...register(\\\`social.\\\${index}.platform\\\`)}
              placeholder="Platform"
            />
            <input
              {...register(\\\`social.\\\${index}.url\\\`)}
              placeholder="URL"
            />
            <button type="button" onClick={() => remove(index)}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ platform: '', url: '' })}
        >
          Add Social Media
        </button>
      </div>

      <div>
        <p>Full Name: {firstName} {lastName}</p>
        <p>Email: {watchedEmail}</p>
        <p>Form is {isDirty ? 'dirty' : 'pristine'}</p>
        <p>Form is {isValid ? 'valid' : 'invalid'}</p>
      </div>

      <button type="submit">Submit</button>
      <button type="button" onClick={handleReset}>Reset</button>
      <button type="button" onClick={handleFill}>Fill Form</button>
    </form>
  );
}
\\\`\\\`\\\`

## Formik

### Installation

\\\`\\\`\\\`bash
npm install formik yup
\\\`\\\`\\\`

### Basic Formik Form

\\\`\\\`\\\`jsx
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Required'),
  password: Yup.string()
    .min(8, 'Too short')
    .required('Required'),
});

function LoginForm() {
  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
      }}
      validationSchema={LoginSchema}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });

          if (!response.ok) {
            setErrors({ email: 'Invalid credentials' });
          } else {
            console.log('Login successful');
          }
        } catch (error) {
          setErrors({ email: 'Login failed' });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, errors, touched }) => (
        <Form>
          <div>
            <label htmlFor="email">Email</label>
            <Field 
              id="email" 
              name="email" 
              type="email" 
              className={errors.email && touched.email ? 'error-field' : ''}
            />
            <ErrorMessage name="email" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <Field 
              id="password" 
              name="password" 
              type="password"
              className={errors.password && touched.password ? 'error-field' : ''}
            />
            <ErrorMessage name="password" component="div" className="error" />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </Form>
      )}
    </Formik>
  );
}
\\\`\\\`\\\`

### Formik with Custom Components

\\\`\\\`\\\`jsx
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';

const ProfileSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  bio: Yup.string().max(500, 'Too long'),
  skills: Yup.array().of(Yup.string()).min(1, 'Add at least one skill'),
  preferences: Yup.object({
    emailNotifications: Yup.boolean(),
    theme: Yup.string().oneOf(['light', 'dark']),
  }),
});

function ProfileForm() {
  return (
    <Formik
      initialValues={{
        name: '',
        bio: '',
        skills: [''],
        preferences: {
          emailNotifications: true,
          theme: 'light',
        },
      }}
      validationSchema={ProfileSchema}
      onSubmit={(values) => {
        console.log(values);
      }}
    >
      {({ values, errors, touched, setFieldValue }) => (
        <Form>
          <div>
            <label>Name</label>
            <Field name="name" />
            {errors.name && touched.name && (
              <div className="error">{errors.name}</div>
            )}
          </div>

          <div>
            <label>Bio</label>
            <Field name="bio" as="textarea" rows="4" />
            {errors.bio && touched.bio && (
              <div className="error">{errors.bio}</div>
            )}
          </div>

          {/* Dynamic array of fields */}
          <FieldArray name="skills">
            {({ push, remove }) => (
              <div>
                <label>Skills</label>
                {values.skills.map((skill, index) => (
                  <div key={index}>
                    <Field name={\\\`skills.\\\${index}\\\`} placeholder="Skill" />
                    <button type="button" onClick={() => remove(index)}>
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => push('')}>
                  Add Skill
                </button>
                {errors.skills && typeof errors.skills === 'string' && (
                  <div className="error">{errors.skills}</div>
                )}
              </div>
            )}
          </FieldArray>

          {/* Nested object fields */}
          <div>
            <h3>Preferences</h3>
            <label>
              <Field 
                type="checkbox" 
                name="preferences.emailNotifications" 
              />
              Email Notifications
            </label>

            <label>Theme</label>
            <Field as="select" name="preferences.theme">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Field>
          </div>

          <button type="submit">Save Profile</button>
        </Form>
      )}
    </Formik>
  );
}
\\\`\\\`\\\`

## Custom Validation

### Custom Validators

\\\`\\\`\\\`jsx
import * as yup from 'yup';

// Custom validation method
yup.addMethod(yup.string, 'strongPassword', function(message) {
  return this.test('strong-password', message, function(value) {
    const { path, createError } = this;
    
    if (!value) return true; // Let required handle empty
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\\d/.test(value);
    const hasSpecialChar = /[@$!%*?&]/.test(value);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return createError({
        path,
        message: message || 'Password must contain uppercase, lowercase, number, and special character',
      });
    }
    
    return true;
  });
});

// Usage
const schema = yup.object({
  password: yup
    .string()
    .required()
    .min(8)
    .strongPassword(),
});

// Async validation
const usernameSchema = yup.object({
  username: yup
    .string()
    .required()
    .test('unique-username', 'Username already taken', async (value) => {
      if (!value) return true;
      
      const response = await fetch(\\\`/api/check-username?username=\\\${value}\\\`);
      const data = await response.json();
      return data.available;
    }),
});
\\\`\\\`\\\`

## File Upload Forms

\\\`\\\`\\\`jsx
import { useForm } from 'react-hook-form';
import { useState } from 'react';

function FileUploadForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [preview, setPreview] = useState(null);

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('image', data.image[0]);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Upload successful');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Title</label>
        <input {...register('title', { required: true })} />
        {errors.title && <span>Title is required</span>}
      </div>

      <div>
        <label>Description</label>
        <textarea {...register('description')} />
      </div>

      <div>
        <label>Image</label>
        <input
          type="file"
          accept="image/*"
          {...register('image', {
            required: 'Image is required',
            validate: {
              fileSize: (files) => {
                if (files[0]?.size > 5000000) {
                  return 'File size must be less than 5MB';
                }
                return true;
              },
              fileType: (files) => {
                if (!files[0]?.type.startsWith('image/')) {
                  return 'Only image files are allowed';
                }
                return true;
              },
            },
          })}
          onChange={handleFileChange}
        />
        {errors.image && <span>{errors.image.message}</span>}
      </div>

      {preview && (
        <div>
          <img src={preview} alt="Preview" style={{ maxWidth: '200px' }} />
        </div>
      )}

      <button type="submit">Upload</button>
    </form>
  );
}
\\\`\\\`\\\`

## Best Practices

### 1. Use Uncontrolled Inputs for Performance

React Hook Form uses uncontrolled inputs by default, which reduces re-renders.

### 2. Validate on Blur for Better UX

\\\`\\\`\\\`jsx
useForm({
  mode: 'onBlur' // Validate when user leaves field
})
\\\`\\\`\\\`

### 3. Use Schema Validation

Yup schemas are cleaner and reusable:

\\\`\\\`\\\`jsx
// ✅ Good: Reusable schema
const schema = yup.object({...});

// ❌ Bad: Inline validation rules scattered throughout form
\\\`\\\`\\\`

### 4. Handle Loading and Error States

Always show feedback during submission and handle errors gracefully.

### 5. Accessible Forms

\\\`\\\`\\\`jsx
<label htmlFor="email">Email</label>
<input 
  id="email"
  {...register('email')}
  aria-invalid={errors.email ? 'true' : 'false'}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email.message}
  </span>
)}
\\\`\\\`\\\`

## Summary

Modern form handling in React is made easy with React Hook Form and Formik:

- **React Hook Form**: Best performance, minimal re-renders
- **Formik**: Full-featured, easier for complex forms
- **Yup**: Schema validation works with both
- **Validation**: Real-time, on-blur, or on-submit
- **File Uploads**: Handle with FormData
- **Accessibility**: Always include proper labels and ARIA attributes`,
      [
        'React Hook Form uses uncontrolled inputs for better performance',
        'Yup provides schema-based validation for both React Hook Form and Formik',
        'useFieldArray enables dynamic form fields like adding or removing items',
        'Validate on blur instead of onChange for better user experience',
        'File uploads require FormData and proper validation for size and type',
        'Always include proper labels and ARIA attributes for accessibility'
      ]
    ]);

    const lessonId = lesson.rows[0].id;

    const codeExamples = [
      {
        title: 'React Hook Form with Yup Validation',
        code: `import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'At least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'At least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/,
      'Must contain uppercase, lowercase, and number'
    ),
  
  confirmPassword: yup
    .string()
    .required('Please confirm password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  
  age: yup
    .number()
    .required('Age is required')
    .positive('Must be positive')
    .integer('Must be a whole number')
    .min(18, 'Must be 18 or older'),
  
  terms: yup
    .boolean()
    .oneOf([true], 'Must accept terms'),
});

function RegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Registration successful!');
        reset();
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="registration-form">
      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          {...register('username')}
          className={errors.username ? 'error' : ''}
        />
        {errors.username && (
          <span className="error-message">{errors.username.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={errors.password ? 'error' : ''}
        />
        {errors.password && (
          <span className="error-message">{errors.password.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className={errors.confirmPassword ? 'error' : ''}
        />
        {errors.confirmPassword && (
          <span className="error-message">{errors.confirmPassword.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="age">Age</label>
        <input
          id="age"
          type="number"
          {...register('age')}
          className={errors.age ? 'error' : ''}
        />
        {errors.age && (
          <span className="error-message">{errors.age.message}</span>
        )}
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" {...register('terms')} />
          I accept the terms and conditions
        </label>
        {errors.terms && (
          <span className="error-message">{errors.terms.message}</span>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Submitting...' : 'Register'}
        </button>
        <button type="button" onClick={() => reset()} disabled={!isDirty}>
          Reset
        </button>
      </div>
    </form>
  );
}`,
        language: 'jsx',
        explanation: 'Complete registration form with React Hook Form and Yup schema validation, demonstrating various validation rules and error handling.'
      },
      {
        title: 'Dynamic Form Fields with useFieldArray',
        code: `import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useState } from 'react';

function DynamicForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      companyName: '',
      employees: [
        { name: '', email: '', role: 'developer' }
      ],
      projects: []
    }
  });

  const { fields: employeeFields, append: appendEmployee, remove: removeEmployee } = useFieldArray({
    control,
    name: 'employees'
  });

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
    control,
    name: 'projects'
  });

  const watchEmployees = watch('employees');

  const onSubmit = (data) => {
    console.log('Form Data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Company Name</label>
        <input
          {...register('companyName', { required: 'Company name is required' })}
        />
        {errors.companyName && (
          <span className="error">{errors.companyName.message}</span>
        )}
      </div>

      <div className="section">
        <h2>Employees</h2>
        {employeeFields.map((field, index) => (
          <div key={field.id} className="field-group">
            <h3>Employee {index + 1}</h3>
            
            <div>
              <label>Name</label>
              <input
                {...register(\\\`employees.\\\${index}.name\\\`, {
                  required: 'Name is required'
                })}
                placeholder="Full Name"
              />
              {errors.employees?.[index]?.name && (
                <span className="error">
                  {errors.employees[index].name.message}
                </span>
              )}
            </div>

            <div>
              <label>Email</label>
              <input
                {...register(\\\`employees.\\\${index}.email\\\`, {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i,
                    message: 'Invalid email'
                  }
                })}
                placeholder="email@example.com"
              />
              {errors.employees?.[index]?.email && (
                <span className="error">
                  {errors.employees[index].email.message}
                </span>
              )}
            </div>

            <div>
              <label>Role</label>
              <select {...register(\\\`employees.\\\${index}.role\\\`)}>
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="manager">Manager</option>
                <option value="qa">QA Engineer</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => removeEmployee(index)}
              disabled={employeeFields.length === 1}
            >
              Remove Employee
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => appendEmployee({ name: '', email: '', role: 'developer' })}
        >
          Add Employee
        </button>
      </div>

      <div className="section">
        <h2>Projects</h2>
        {projectFields.map((field, index) => (
          <div key={field.id} className="field-group">
            <div>
              <label>Project Name</label>
              <input
                {...register(\\\`projects.\\\${index}.name\\\`, {
                  required: 'Project name is required'
                })}
              />
              {errors.projects?.[index]?.name && (
                <span className="error">
                  {errors.projects[index].name.message}
                </span>
              )}
            </div>

            <div>
              <label>Description</label>
              <textarea
                {...register(\\\`projects.\\\${index}.description\\\`)}
                rows="3"
              />
            </div>

            <div>
              <label>Assign To</label>
              <select {...register(\\\`projects.\\\${index}.assignedTo\\\`)}>
                <option value="">Select employee...</option>
                {watchEmployees.map((emp, empIndex) => (
                  <option key={empIndex} value={empIndex}>
                    {emp.name || \\\`Employee \\\${empIndex + 1}\\\`}
                  </option>
                ))}
              </select>
            </div>

            <button type="button" onClick={() => removeProject(index)}>
              Remove Project
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => appendProject({ name: '', description: '', assignedTo: '' })}
        >
          Add Project
        </button>
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}`,
        language: 'jsx',
        explanation: 'Dynamic form with useFieldArray for managing multiple employees and projects, including cross-field dependencies.'
      },
      {
        title: 'Formik with Complex Validation',
        code: `import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';

const ProfileSchema = Yup.object().shape({
  personalInfo: Yup.object({
    firstName: Yup.string().required('Required'),
    lastName: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    phone: Yup.string().matches(/^\\d{10}$/, 'Must be 10 digits'),
  }),
  
  address: Yup.object({
    street: Yup.string().required('Required'),
    city: Yup.string().required('Required'),
    state: Yup.string().required('Required'),
    zipCode: Yup.string().matches(/^\\d{5}$/, 'Must be 5 digits').required('Required'),
  }),
  
  skills: Yup.array()
    .of(
      Yup.object({
        name: Yup.string().required('Required'),
        level: Yup.string().oneOf(['beginner', 'intermediate', 'advanced']).required('Required'),
      })
    )
    .min(1, 'Add at least one skill'),
  
  preferences: Yup.object({
    newsletter: Yup.boolean(),
    notifications: Yup.boolean(),
    theme: Yup.string().oneOf(['light', 'dark']),
  }),
});

function ProfileForm() {
  const initialValues = {
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    skills: [
      { name: '', level: 'beginner' }
    ],
    preferences: {
      newsletter: true,
      notifications: false,
      theme: 'light',
    },
  };

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.field) {
          setFieldError(error.field, error.message);
        }
      } else {
        alert('Profile saved successfully!');
      }
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ProfileSchema}
      onSubmit={handleSubmit}
      validateOnChange={false}
      validateOnBlur={true}
    >
      {({ values, errors, touched, isSubmitting, isValid }) => (
        <Form>
          <section>
            <h2>Personal Information</h2>
            
            <div>
              <label htmlFor="personalInfo.firstName">First Name</label>
              <Field name="personalInfo.firstName" />
              <ErrorMessage name="personalInfo.firstName" component="div" className="error" />
            </div>

            <div>
              <label htmlFor="personalInfo.lastName">Last Name</label>
              <Field name="personalInfo.lastName" />
              <ErrorMessage name="personalInfo.lastName" component="div" className="error" />
            </div>

            <div>
              <label htmlFor="personalInfo.email">Email</label>
              <Field name="personalInfo.email" type="email" />
              <ErrorMessage name="personalInfo.email" component="div" className="error" />
            </div>

            <div>
              <label htmlFor="personalInfo.phone">Phone</label>
              <Field name="personalInfo.phone" />
              <ErrorMessage name="personalInfo.phone" component="div" className="error" />
            </div>
          </section>

          <section>
            <h2>Address</h2>
            
            <div>
              <label htmlFor="address.street">Street</label>
              <Field name="address.street" />
              <ErrorMessage name="address.street" component="div" className="error" />
            </div>

            <div>
              <label htmlFor="address.city">City</label>
              <Field name="address.city" />
              <ErrorMessage name="address.city" component="div" className="error" />
            </div>

            <div>
              <label htmlFor="address.state">State</label>
              <Field name="address.state" />
              <ErrorMessage name="address.state" component="div" className="error" />
            </div>

            <div>
              <label htmlFor="address.zipCode">ZIP Code</label>
              <Field name="address.zipCode" />
              <ErrorMessage name="address.zipCode" component="div" className="error" />
            </div>
          </section>

          <section>
            <h2>Skills</h2>
            
            <FieldArray name="skills">
              {({ push, remove }) => (
                <div>
                  {values.skills.map((skill, index) => (
                    <div key={index} className="skill-group">
                      <div>
                        <label>Skill Name</label>
                        <Field name={\\\`skills.\\\${index}.name\\\`} placeholder="e.g., React" />
                        <ErrorMessage
                          name={\\\`skills.\\\${index}.name\\\`}
                          component="div"
                          className="error"
                        />
                      </div>

                      <div>
                        <label>Level</label>
                        <Field as="select" name={\\\`skills.\\\${index}.level\\\`}>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </Field>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={values.skills.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => push({ name: '', level: 'beginner' })}
                  >
                    Add Skill
                  </button>

                  {errors.skills && typeof errors.skills === 'string' && (
                    <div className="error">{errors.skills}</div>
                  )}
                </div>
              )}
            </FieldArray>
          </section>

          <section>
            <h2>Preferences</h2>
            
            <div>
              <label>
                <Field type="checkbox" name="preferences.newsletter" />
                Subscribe to newsletter
              </label>
            </div>

            <div>
              <label>
                <Field type="checkbox" name="preferences.notifications" />
                Enable notifications
              </label>
            </div>

            <div>
              <label>Theme</label>
              <Field as="select" name="preferences.theme">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Field>
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}`,
        language: 'jsx',
        explanation: 'Complex Formik form with nested objects, dynamic arrays, and comprehensive validation using Yup schema.'
      },
      {
        title: 'File Upload with Preview',
        code: `import { useForm } from 'react-hook-form';
import { useState } from 'react';

function FileUploadForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm();

  const [filePreviews, setFilePreviews] = useState([]);

  const watchFiles = watch('files');

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    
    // Generate previews
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      name: file.name,
    }));
    
    setFilePreviews(previews);
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    
    // Add files
    Array.from(data.files).forEach((file, index) => {
      formData.append(\\\`files[\\\${index}]\\\`, file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Files uploaded successfully!');
        reset();
        setFilePreviews([]);
      } else {
        alert('Upload failed!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed!');
    }
  };

  const removePreview = (index) => {
    const newPreviews = [...filePreviews];
    URL.revokeObjectURL(newPreviews[index].url);
    newPreviews.splice(index, 1);
    setFilePreviews(newPreviews);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="upload-form">
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          {...register('title', { required: 'Title is required' })}
          placeholder="Enter title"
        />
        {errors.title && (
          <span className="error">{errors.title.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          {...register('description')}
          placeholder="Enter description"
          rows="4"
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select id="category" {...register('category', { required: true })}>
          <option value="">Select category...</option>
          <option value="images">Images</option>
          <option value="documents">Documents</option>
          <option value="videos">Videos</option>
        </select>
        {errors.category && (
          <span className="error">Category is required</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="files">Files</label>
        <input
          id="files"
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          {...register('files', {
            required: 'Please select at least one file',
            validate: {
              maxSize: (files) => {
                const maxSize = 10 * 1024 * 1024; // 10MB
                for (const file of files) {
                  if (file.size > maxSize) {
                    return \\\`File "\\\${file.name}" is too large (max 10MB)\\\`;
                  }
                }
                return true;
              },
              maxFiles: (files) => {
                if (files.length > 5) {
                  return 'Maximum 5 files allowed';
                }
                return true;
              },
              fileType: (files) => {
                const allowedTypes = ['image/', 'video/', 'application/pdf', 'application/msword'];
                for (const file of files) {
                  if (!allowedTypes.some(type => file.type.startsWith(type) || file.type === type)) {
                    return \\\`File "\\\${file.name}" has an invalid type\\\`;
                  }
                }
                return true;
              },
            },
          })}
          onChange={handleFileChange}
        />
        {errors.files && (
          <span className="error">{errors.files.message}</span>
        )}
      </div>

      {filePreviews.length > 0 && (
        <div className="previews">
          <h3>File Previews ({filePreviews.length})</h3>
          <div className="preview-grid">
            {filePreviews.map((preview, index) => (
              <div key={index} className="preview-item">
                {preview.type.startsWith('image/') ? (
                  <img src={preview.url} alt={preview.name} />
                ) : preview.type.startsWith('video/') ? (
                  <video src={preview.url} controls />
                ) : (
                  <div className="file-icon">
                    <span>📄</span>
                  </div>
                )}
                
                <div className="preview-info">
                  <p className="file-name">{preview.name}</p>
                  <p className="file-size">{formatFileSize(preview.size)}</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => removePreview(index)}
                  className="remove-button"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting || filePreviews.length === 0}>
          {isSubmitting ? 'Uploading...' : 'Upload Files'}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            filePreviews.forEach(p => URL.revokeObjectURL(p.url));
            setFilePreviews([]);
          }}
          disabled={isSubmitting}
        >
          Clear
        </button>
      </div>
    </form>
  );
}`,
        language: 'jsx',
        explanation: 'Complete file upload form with preview, validation for size/type/count, and proper memory cleanup for object URLs.'
      }
    ];

    for (const example of codeExamples) {
      await client.query(
        `INSERT INTO code_examples (lesson_id, title, code, language, explanation, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [lessonId, example.title, example.code, example.language, example.explanation, codeExamples.indexOf(example)]
      );
    }

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the main performance advantage of React Hook Form over Formik?', 'multiple_choice', $2, 'React Hook Form uses uncontrolled inputs, resulting in fewer re-renders', 'React Hook Form uses uncontrolled inputs by default, which means it does not re-render the component on every keystroke, resulting in better performance compared to Formik which uses controlled inputs.', 'medium', 15, 1),
      ($1, 'How do you implement field-level validation with Yup in React Hook Form?', 'multiple_choice', $3, 'Use yupResolver in useForm and define a Yup schema', 'You use yupResolver from @hookform/resolvers/yup and pass it to useForm along with a Yup schema that defines all validation rules.', 'easy', 10, 2),
      ($1, 'What hook is used for dynamic form fields (add/remove) in React Hook Form?', 'multiple_choice', $4, 'useFieldArray', 'useFieldArray is specifically designed for managing dynamic arrays of fields, providing methods like append, remove, and move to manipulate the field array.', 'easy', 10, 3),
      ($1, 'When validating file uploads, what should you check?', 'multiple_choice', $5, 'File size, file type, and number of files', 'When validating file uploads, you should check the file size (to prevent large uploads), file type (to ensure only allowed formats), and optionally the number of files being uploaded.', 'medium', 15, 4),
      ($1, 'What is the recommended validation mode for better user experience?', 'multiple_choice', $6, 'onBlur - validate when user leaves the field', 'Using onBlur mode provides better UX because it only validates after the user finishes typing and leaves the field, rather than showing errors while they are still typing.', 'medium', 15, 5)
    `, [
      lessonId,
      JSON.stringify(['React Hook Form has built-in caching', 'React Hook Form uses uncontrolled inputs, resulting in fewer re-renders', 'Formik is always slower than React Hook Form', 'React Hook Form does not support validation']),
      JSON.stringify(['Pass validation rules directly to register', 'Use yupResolver in useForm and define a Yup schema', 'Yup cannot be used with React Hook Form', 'Create custom validation functions for each field']),
      JSON.stringify(['useForm', 'useFieldArray', 'useState with array manipulation', 'useWatch']),
      JSON.stringify(['Only file size', 'Only file type', 'File size, file type, and number of files', 'No validation is needed for files']),
      JSON.stringify(['onChange - validate on every keystroke', 'onSubmit - validate only when form is submitted', 'onBlur - validate when user leaves the field', 'onMount - validate immediately'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Forms & Validation lesson added successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding Forms & Validation lesson:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedFormsValidation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

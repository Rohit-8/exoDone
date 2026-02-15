// ============================================================================
// Forms & Validation — Code Examples
// ============================================================================

const examples = {
  'react-hook-form': [
    {
      title: "Dynamic Fields with useFieldArray",
      description: "Add/remove form fields dynamically.",
      language: "javascript",
      code: `import { useForm, useFieldArray } from 'react-hook-form';

function SkillsForm() {
  const { register, control, handleSubmit } = useForm({
    defaultValues: { skills: [{ name: '', level: 'beginner' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'skills' });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(\`skills.\${index}.name\`)} placeholder="Skill name" />
          <select {...register(\`skills.\${index}.level\`)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: '', level: 'beginner' })}>
        Add Skill
      </button>
      <button type="submit">Submit</button>
    </form>
  );
}`,
      explanation: "useFieldArray manages arrays of form fields. Each field gets a unique id for React keys. append/remove/swap/move manipulate the array.",
      order_index: 1,
    },
  ],
};

export default examples;

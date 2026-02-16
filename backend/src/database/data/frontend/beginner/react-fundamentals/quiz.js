// ============================================================================
// React Fundamentals — Quiz Questions (Enhanced)
// ============================================================================

const quiz = {
  'intro-jsx': [
    {
      question_text: 'What does the following JSX expression render?\n\n```jsx\nconst count = 0;\nreturn <div>{count && <span>You have messages</span>}</div>;\n```',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'An empty <div></div>',
        'A <div> containing the number 0',
        'A <div> containing "You have messages"',
        'A runtime error because count is falsy',
      ]),
      correct_answer: 'A <div> containing the number 0',
      explanation:
        'In JavaScript, 0 && expression evaluates to 0 (the left-hand falsy value). React renders the number 0 as text in the DOM rather than skipping it. This is a common pitfall with the logical AND (&&) pattern. To avoid it, convert the condition to a boolean explicitly: {count > 0 && <span>…</span>} or use a ternary.',
      difficulty: 'medium',
      order_index: 1,
    },
    {
      question_text: 'Which of the following is TRUE about JSX?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'JSX is a separate templating language that runs in the browser natively',
        'JSX expressions are transformed into React.createElement() calls at compile time',
        'JSX cannot contain JavaScript expressions — only static HTML',
        'JSX requires a special JSX runtime installed separately from React',
      ]),
      correct_answer: 'JSX expressions are transformed into React.createElement() calls at compile time',
      explanation:
        'JSX is syntactic sugar that tools like Babel or SWC compile into React.createElement() (or the modern JSX transform\'s jsx() function) before the code ever reaches the browser. It is not a separate language; it is JavaScript with an HTML-like syntax extension. You can embed any valid JavaScript expression inside curly braces {}.',
      difficulty: 'easy',
      order_index: 2,
    },
    {
      question_text: 'Why must JSX components return a single root element (or use a Fragment)?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'Because HTML does not allow sibling elements without a parent',
        'Because a JavaScript function can only return one value, and multiple JSX siblings would be multiple values',
        'Because React crashes if more than one element is returned',
        'Because CSS styling requires a single root container',
      ]),
      correct_answer: 'Because a JavaScript function can only return one value, and multiple JSX siblings would be multiple values',
      explanation:
        'Each JSX element compiles to a single React.createElement() call (one value). A function can only return one value in JavaScript, so multiple sibling elements would be multiple return values — which is not valid syntax. Wrapping them in a parent <div> or a <Fragment> produces one createElement call that contains the others as children.',
      difficulty: 'medium',
      order_index: 3,
    },
    {
      question_text: 'What is the key difference between <Fragment key={id}> and the shorthand <>…</>?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'There is no difference; they are completely interchangeable',
        'The shorthand <></> supports key and other attributes but <Fragment> does not',
        'The explicit <Fragment> form can accept a key prop, while the shorthand <></> cannot accept any props',
        'The shorthand <></> renders a <div> in the DOM while <Fragment> does not',
      ]),
      correct_answer: 'The explicit <Fragment> form can accept a key prop, while the shorthand <></> cannot accept any props',
      explanation:
        'The shorthand <></> is a convenient alias for <Fragment> but does not support any attributes. When you need to provide a key (e.g., when mapping over a list of fragments), you must use the explicit <Fragment key={…}> syntax. Neither form produces any extra DOM element.',
      difficulty: 'easy',
      order_index: 4,
    },
    {
      question_text: 'Given the JSX below, what will be rendered when isLoggedIn is false and isAdmin is true?\n\n```jsx\n{isLoggedIn ? (\n  isAdmin ? <AdminPanel /> : <UserDashboard />\n) : (\n  <LoginPage />\n)}\n```',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        '<AdminPanel />',
        '<UserDashboard />',
        '<LoginPage />',
        'Nothing is rendered',
      ]),
      correct_answer: '<LoginPage />',
      explanation:
        'The outer ternary checks isLoggedIn first. Since isLoggedIn is false, the entire expression evaluates to the "else" branch — <LoginPage />. The inner ternary (isAdmin check) is never reached because it is in the "then" branch of the outer ternary.',
      difficulty: 'medium',
      order_index: 5,
    },
  ],

  'components-props': [
    {
      question_text: 'What will this component render?\n\n```jsx\nfunction Greeting({ name = "World" }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\n<Greeting name={undefined} />\n```',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'Hello, undefined!',
        'Hello, World!',
        'Hello, !',
        'A TypeError because undefined is not a string',
      ]),
      correct_answer: 'Hello, World!',
      explanation:
        'When a prop is explicitly passed as undefined (or omitted entirely), JavaScript destructuring default values kick in. Since name is undefined, the default value "World" is used. Note: passing null would NOT trigger the default — it would render "Hello, !" because null is not undefined.',
      difficulty: 'medium',
      order_index: 1,
    },
    {
      question_text: 'Which pattern best solves prop drilling (passing props through many intermediate components that do not use them)?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'Adding more props to intermediate components for flexibility',
        'Using component composition — passing already-configured elements as children or slot props',
        'Converting all components to class components',
        'Using inline styles instead of prop-based styling',
      ]),
      correct_answer: 'Using component composition — passing already-configured elements as children or slot props',
      explanation:
        'Component composition lets you build elements at the top level where data is available and pass them as children (or named slot props) through intermediaries. The intermediate components render {children} without knowing or caring about the data, breaking the drilling chain. Context API is another solution, but composition is often simpler for UI layout concerns.',
      difficulty: 'medium',
      order_index: 2,
    },
    {
      question_text: 'What is the purpose of the "key" prop when rendering a list of components?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'It sets the HTML id attribute on the element',
        'It helps React identify which items have changed, been added, or removed for efficient re-rendering',
        'It determines the CSS z-index order of the elements',
        'It is required by JavaScript\'s Array.map() method',
      ]),
      correct_answer: 'It helps React identify which items have changed, been added, or removed for efficient re-rendering',
      explanation:
        'The key prop is a special React attribute used during reconciliation (diffing). It lets React match elements between renders so it can reuse existing DOM nodes, reorder them, or remove them efficiently. Keys should be stable, unique identifiers (like database IDs), not array indices, to avoid bugs when items are reordered or filtered.',
      difficulty: 'easy',
      order_index: 3,
    },
    {
      question_text: 'What does the children prop represent in a React component?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'An array of child components registered in a global component registry',
        'The JSX content placed between the opening and closing tags of the component',
        'A reference to the component\'s parent element',
        'The component\'s internal state variables',
      ]),
      correct_answer: 'The JSX content placed between the opening and closing tags of the component',
      explanation:
        'In React, any content placed between <Component> and </Component> is passed to the component as the special "children" prop. This can be text, JSX elements, or even functions (render props). It is the foundation of the composition pattern and allows components to be agnostic about what they render inside.',
      difficulty: 'easy',
      order_index: 4,
    },
    {
      question_text: 'Consider this render-prop pattern:\n\n```jsx\n<DataList\n  items={users}\n  renderItem={(user) => <UserCard user={user} />}\n/>\n```\n\nWhat is the primary advantage of using a renderItem prop instead of hardcoding <UserCard /> inside DataList?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'It improves runtime performance by reducing re-renders',
        'It makes DataList reusable with any item type because the consumer controls how each item is rendered',
        'It prevents prop drilling by avoiding the need for user data',
        'It is required by React when using Array.map()',
      ]),
      correct_answer: 'It makes DataList reusable with any item type because the consumer controls how each item is rendered',
      explanation:
        'The render-prop pattern inverts control: DataList handles iteration, empty states, and list semantics, while the consumer decides the visual representation of each item via renderItem. This makes DataList a generic, reusable component — it can render user cards, product tiles, log entries, or any other item type without modification.',
      difficulty: 'medium',
      order_index: 5,
    },
  ],

  'events-conditionals': [
    {
      question_text: 'What does e.preventDefault() do when called inside a form\'s onSubmit handler?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'It prevents React from re-rendering the component',
        'It stops the browser from performing its default form submission (which causes a full page reload)',
        'It cancels all other event listeners on the form',
        'It prevents the form data from being stored in state',
      ]),
      correct_answer: 'It stops the browser from performing its default form submission (which causes a full page reload)',
      explanation:
        'When a <form> is submitted, the browser\'s default behaviour is to send an HTTP request and reload the page. In a React single-page application, this would destroy the app state. Calling e.preventDefault() suppresses this default action, allowing you to handle submission with JavaScript (e.g., fetch/axios). It does not affect React renders or other event listeners.',
      difficulty: 'easy',
      order_index: 1,
    },
    {
      question_text: 'When should you use e.stopPropagation() in a React event handler?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'To prevent the event from reaching parent components\' handlers during the bubbling phase',
        'To cancel the browser\'s default action for the event',
        'To stop React from batching state updates',
        'To prevent the component from re-rendering after the event',
      ]),
      correct_answer: 'To prevent the event from reaching parent components\' handlers during the bubbling phase',
      explanation:
        'e.stopPropagation() stops the event from bubbling up the DOM tree. For example, if a button inside a clickable list item has its own onClick handler, calling stopPropagation in the button handler prevents the list item\'s onClick from also firing. This is different from preventDefault, which cancels the browser\'s default action (like following a link or submitting a form).',
      difficulty: 'medium',
      order_index: 2,
    },
    {
      question_text: 'What is the output of the following code when the button is clicked?\n\n```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  const handleClick = () => {\n    setCount(count + 1);\n    setCount(count + 1);\n    setCount(count + 1);\n  };\n\n  return <button onClick={handleClick}>{count}</button>;\n}\n```',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'The count increments by 3 (0 → 3)',
        'The count increments by 1 (0 → 1) because all three calls use the same stale count value',
        'A runtime error occurs due to calling setCount multiple times',
        'The count increments by 2 (0 → 2)',
      ]),
      correct_answer: 'The count increments by 1 (0 → 1) because all three calls use the same stale count value',
      explanation:
        'Each call to setCount(count + 1) uses the same count value captured in the closure at the time handleClick was called (0). So all three calls effectively say setCount(0 + 1). React batches these and the final value is 1. To increment by 3, use the functional updater form: setCount(prev => prev + 1) three times, where each call receives the latest pending state.',
      difficulty: 'medium',
      order_index: 3,
    },
    {
      question_text: 'In React, why do we write onClick={handleClick} instead of onClick={handleClick()}?',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'Because React events only accept function references, not return values',
        'Because handleClick() would call the function immediately during render, not when clicked',
        'Because the parentheses syntax is invalid JSX',
        'Both A and B are correct',
      ]),
      correct_answer: 'Both A and B are correct',
      explanation:
        'Writing handleClick() with parentheses invokes the function immediately during the render phase and passes its return value (likely undefined) as the event handler. This causes the function to run on every render, not on click, and can trigger infinite re-render loops if it updates state. We pass handleClick (without parentheses) as a reference so React can call it later when the event actually fires.',
      difficulty: 'easy',
      order_index: 4,
    },
    {
      question_text: 'Which approach correctly passes an argument to an event handler without calling it during render?\n\n```jsx\n// Option A\n<button onClick={handleDelete(item.id)}>Delete</button>\n\n// Option B\n<button onClick={() => handleDelete(item.id)}>Delete</button>\n\n// Option C\n<button onClick={handleDelete}>Delete</button>\n\n// Option D\n<button onClick={(e) => { e.preventDefault(); handleDelete(item.id); }}>Delete</button>\n```',
      question_type: 'multiple_choice',
      options: JSON.stringify([
        'Only Option A',
        'Only Option B',
        'Options B and D',
        'Options A, B, and D',
      ]),
      correct_answer: 'Options B and D',
      explanation:
        'Option A calls handleDelete(item.id) immediately during render — it is NOT an event handler reference. Option B wraps the call in an arrow function, creating a new function reference that React calls on click. Option C passes the function reference but does not supply item.id, so the handler would receive the event object instead. Option D is like B but also accesses the event object for preventDefault. Both B and D correctly defer execution until the click happens.',
      difficulty: 'medium',
      order_index: 5,
    },
  ],
};

export default quiz;

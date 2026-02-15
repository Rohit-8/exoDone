// ============================================================================
// OOP Fundamentals — Quiz Questions
// ============================================================================

const quiz = {
  'classes-objects-encapsulation': [
    {
      question_text: "What is encapsulation in OOP?",
      question_type: "multiple_choice",
      options: ["Inheriting from a parent class","Bundling data and methods while hiding internal state","Creating multiple instances of a class","Converting objects to JSON"],
      correct_answer: "Bundling data and methods while hiding internal state",
      explanation: "Encapsulation hides internal implementation details and exposes a controlled public interface, protecting data integrity.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "How do you declare a private field in modern JavaScript classes?",
      question_type: "multiple_choice",
      options: ["Using the private keyword","Prefixing with # (e.g., #balance)","Prefixing with _ (e.g., _balance)","Using Object.freeze()"],
      correct_answer: "Prefixing with # (e.g., #balance)",
      explanation: "JavaScript uses the # prefix for truly private class fields. The _ prefix is just a convention with no enforcement.",
      difficulty: "easy",
      order_index: 2,
    },
  ],
  'inheritance-polymorphism': [
    {
      question_text: "What does the super() call do in a subclass constructor?",
      question_type: "multiple_choice",
      options: ["Creates a new instance of the subclass","Calls the parent class constructor","Makes the class abstract","Overrides the parent method"],
      correct_answer: "Calls the parent class constructor",
      explanation: "super() invokes the parent class constructor, which is required in subclass constructors before accessing \"this\".",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What is polymorphism?",
      question_type: "multiple_choice",
      options: ["Having multiple constructors","Objects of different types responding to the same interface","A class inheriting from multiple parents","Converting between data types"],
      correct_answer: "Objects of different types responding to the same interface",
      explanation: "Polymorphism allows different classes to be used interchangeably through a shared interface, each providing its own implementation.",
      difficulty: "easy",
      order_index: 2,
    },
  ],
  'abstraction-solid-intro': [
    {
      question_text: "What does the Single Responsibility Principle state?",
      question_type: "multiple_choice",
      options: ["A class should do everything","A class should have only one reason to change","A class should be a singleton","Methods should have one parameter"],
      correct_answer: "A class should have only one reason to change",
      explanation: "SRP means each class should have one job or responsibility. This makes code easier to understand, test, and maintain.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What is Dependency Inversion about?",
      question_type: "multiple_choice",
      options: ["Inverting the call stack","Depending on abstractions, not concrete implementations","Avoiding all dependencies","Using only static methods"],
      correct_answer: "Depending on abstractions, not concrete implementations",
      explanation: "DIP states that high-level modules should not depend on low-level modules. Both should depend on abstractions (interfaces/abstract classes).",
      difficulty: "medium",
      order_index: 2,
    },
  ],
};

export default quiz;

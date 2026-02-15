// ============================================================================
// Design Patterns — Code Examples
// ============================================================================

const examples = {
  'creational-patterns': [
    {
      title: "Abstract Factory — UI Theme",
      description: "Create families of themed UI components.",
      language: "javascript",
      code: `// Abstract products
class Button { render() {} }
class Input { render() {} }

// Dark theme family
class DarkButton extends Button {
  render() { return '<button class="bg-gray-800 text-white">Click</button>'; }
}
class DarkInput extends Input {
  render() { return '<input class="bg-gray-700 text-white border-gray-600" />'; }
}

// Light theme family
class LightButton extends Button {
  render() { return '<button class="bg-white text-black border">Click</button>'; }
}
class LightInput extends Input {
  render() { return '<input class="bg-gray-50 text-black border" />'; }
}

// Abstract Factory
class ThemeFactory {
  static create(theme) {
    const factories = {
      dark: { button: () => new DarkButton(), input: () => new DarkInput() },
      light: { button: () => new LightButton(), input: () => new LightInput() },
    };
    return factories[theme] || factories.light;
  }
}

const factory = ThemeFactory.create('dark');
const btn = factory.button();
const inp = factory.input();`,
      explanation: "Abstract Factory ensures all UI components belong to the same theme family. Switching themes changes all components consistently.",
      order_index: 1,
    },
  ],
  'structural-behavioral-patterns': [
    {
      title: "Middleware as Chain of Responsibility",
      description: "Express-like middleware pipeline using Chain of Responsibility pattern.",
      language: "javascript",
      code: `class MiddlewarePipeline {
  #middlewares = [];

  use(fn) {
    this.#middlewares.push(fn);
    return this;
  }

  async execute(context) {
    let index = 0;

    const next = async () => {
      if (index >= this.#middlewares.length) return;
      const middleware = this.#middlewares[index++];
      await middleware(context, next);
    };

    await next();
    return context;
  }
}

// Usage
const pipeline = new MiddlewarePipeline();

pipeline.use(async (ctx, next) => {
  ctx.startTime = Date.now();
  await next();
  ctx.duration = Date.now() - ctx.startTime;
});

pipeline.use(async (ctx, next) => {
  console.log(\`Processing: \${ctx.path}\`);
  await next();
});

pipeline.use(async (ctx, next) => {
  ctx.result = { status: 'ok' };
  // Not calling next() stops the chain
});

const result = await pipeline.execute({ path: '/api/data' });`,
      explanation: "Each middleware decides whether to pass control to the next one via next(). This is the exact pattern Express.js uses internally.",
      order_index: 1,
    },
  ],
};

export default examples;

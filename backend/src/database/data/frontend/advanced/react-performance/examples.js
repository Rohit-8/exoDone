// ============================================================================
// React Performance — Code Examples
// ============================================================================

const examples = {
  'memo-profiling': [
    {
      title: "Virtualized List for Large Datasets",
      description: "Using react-window to render only visible items.",
      language: "javascript",
      code: `import { FixedSizeList as List } from 'react-window';

const ITEMS = Array.from({ length: 10000 }, (_, i) => ({
  id: i, name: \`Item \${i + 1}\`, value: Math.random().toFixed(4),
}));

function Row({ index, style }) {
  const item = ITEMS[index];
  return (
    <div style={style} className={\`row \${index % 2 ? 'odd' : 'even'}\`}>
      <span>{item.name}</span>
      <span>{item.value}</span>
    </div>
  );
}

function VirtualizedTable() {
  return (
    <List
      height={600}
      itemCount={ITEMS.length}
      itemSize={40}
      width="100%"
    >
      {Row}
    </List>
  );
}`,
      explanation: "react-window renders only the visible items (~15-20 instead of 10,000). This dramatically reduces DOM nodes and improves scroll performance.",
      order_index: 1,
    },
  ],
  'code-splitting-lazy': [
    {
      title: "Route-Based Code Splitting",
      description: "Lazy-load entire page components for optimal splitting.",
      language: "javascript",
      code: `import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Each import() creates a separate chunk
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Admin = lazy(() => import('./pages/Admin'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin/*" element={<Admin />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}`,
      explanation: "Each lazy() call tells the bundler to create a separate JavaScript chunk. Users only download the chunk for the page they visit.",
      order_index: 1,
    },
  ],
};

export default examples;

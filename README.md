# 🔥 Helix Framework

A modern fullstack framework that combines **UIKit** (React frontend) and **AppKit** (Express backend) with Feature-Based Component Architecture (FBCA).

[![npm version](https://badge.fury.io/js/helix.svg)](https://badge.fury.io/js/helix)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Feature-Based Component Architecture (FBCA)** - Zero-config convention-based routing
- ⚡ **Fullstack Integration** - Seamless frontend-backend communication
- 🎨 **UIKit Components** - Production-ready React components with multiple themes
- 🔧 **AppKit Backend** - Express.js with structured logging and error handling
- 🚀 **Auto-Discovery Routing** - File-based routing similar to Next.js
- 🔄 **Hot Reload** - Fast development with Vite and nodemon
- 📦 **Zero Configuration** - Convention over configuration approach
- 🎭 **Multi-Theme Support** - Built-in theme system (base, elegant, metro, studio, vivid)

## 🚀 Quick Start

### Installation

```bash
npm install -g @voilajsx/helix
```

### Create New Project

```bash
# Create in new directory
helix create my-app
cd my-app
npm run dev

# Or install in current directory
mkdir my-project && cd my-project
helix create .
npm run dev
```

That's it! Your fullstack app is running with:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API: http://localhost:3000/api

## 📁 Project Structure

```
my-app/
├── src/
│   ├── api/                    # Backend (AppKit)
│   │   ├── features/
│   │   │   └── welcome/
│   │   │       ├── welcome.route.ts
│   │   │       └── welcome.service.ts
│   │   ├── lib/
│   │   └── server.ts
│   └── web/                    # Frontend (UIKit)
│       ├── features/
│       │   ├── main/
│       │   │   └── pages/
│       │   │       └── index.tsx    # → /
│       │   ├── gallery/
│       │   │   └── pages/
│       │   │       └── index.tsx    # → /gallery
│       │   └── welcome/
│       │       └── pages/
│       │           └── index.tsx    # → /welcome
│       ├── shared/
│       └── main.tsx
├── dist/                       # Production build
├── package.json
└── tsconfig.json
```

## 🎯 Feature-Based Architecture

### Convention-Based Routing

Helix uses file-based routing where file paths automatically become routes:

```
src/web/features/main/pages/index.tsx     → /
src/web/features/gallery/pages/index.tsx  → /gallery
src/web/features/blog/pages/index.tsx     → /blog
src/web/features/blog/pages/[slug].tsx    → /blog/:slug
src/web/features/docs/pages/[...path].tsx → /docs/*
```

### Creating a New Feature

1. Create feature directory:

```bash
mkdir -p src/web/features/products/pages
```

2. Add a page component:

```tsx
// src/web/features/products/pages/index.tsx
import React from 'react';
import { PageLayout } from '@voilajsx/uikit/page';

const ProductsPage: React.FC = () => {
  return (
    <PageLayout>
      <PageLayout.Content>
        <h1>Products</h1>
        <p>Your products page content here</p>
      </PageLayout.Content>
    </PageLayout>
  );
};

export default ProductsPage;
```

3. Route `/products` is automatically available!

## 🔧 Backend API Integration

### Built-in API Hooks

Helix includes generic API hooks that auto-detect your environment:

```tsx
import { useApi } from '@voilajsx/uikit/hooks';

const MyComponent = () => {
  const { loading, error, get, post } = useApi();

  const fetchData = async () => {
    const result = await get('/api/welcome');
    console.log(result);
  };

  return (
    <button onClick={fetchData} disabled={loading}>
      {loading ? 'Loading...' : 'Fetch Data'}
    </button>
  );
};
```

### Backend Status Checking

```tsx
import { useBackendStatus } from '@voilajsx/uikit/hooks';

const StatusCheck = () => {
  const { isConnected, loading, checkStatus } = useBackendStatus();

  return (
    <div>
      {isConnected ? '✅ Backend Connected' : '❌ Backend Disconnected'}
    </div>
  );
};
```

## 📜 Available Scripts

### Development

```bash
npm run dev        # Start both frontend and backend
npm run dev:api    # Start only backend (Express on port 3000)
npm run dev:web    # Start only frontend (Vite on port 5173)
```

### Production

```bash
npm run build      # Build both frontend and backend
npm start          # Start production server
npm run preview    # Build and preview
```

### Linting

```bash
npm run lint       # Lint everything
npm run lint:api   # Lint backend only
npm run lint:web   # Lint frontend only
```

## 🎨 Themes

Helix includes 5 built-in themes:

- **base** - Clean default configuration
- **elegant** - Fresh sky blue theme with clean design
- **metro** - Dark teal theme with bright yellow accents
- **studio** - Sophisticated neutral theme with golden accents
- **vivid** - Premium cursive theme with sophisticated typography

Change theme in your components:

```tsx
import { useTheme } from '@voilajsx/uikit/theme-provider';

const { theme, setTheme } = useTheme();
setTheme('elegant');
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in your project root:

```env
# Backend Configuration
PORT=3000
NODE_ENV=development
VOILA_FRONTEND_KEY=your-secret-key

# API Configuration
VITE_API_URL=http://localhost:3000
```

### TypeScript Configuration

Helix includes optimized TypeScript configurations:

- `tsconfig.json` - Frontend configuration
- `tsconfig.api.json` - Backend configuration

## 🌟 Examples

### API Route (Backend)

```typescript
// src/api/features/products/products.route.ts
import express from 'express';
import { errorClass } from '@voilajsx/appkit/error';
import { loggerClass } from '@voilajsx/appkit/logger';

const router = express.Router();
const error = errorClass.get();
const logger = loggerClass.get('products');

router.get(
  '/',
  error.asyncRoute(async (req, res) => {
    logger.info('Getting products');
    const products = await getProducts();
    res.json(products);
  })
);

export default router;
```

### Page Component (Frontend)

```tsx
// src/web/features/products/pages/index.tsx
import React, { useEffect, useState } from 'react';
import { useApi } from '@voilajsx/uikit/hooks';
import { Button } from '@voilajsx/uikit/button';
import { Card } from '@voilajsx/uikit/card';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const { loading, get } = useApi();

  useEffect(() => {
    const loadProducts = async () => {
      const data = await get('/api/products');
      setProducts(data);
    };
    loadProducts();
  }, []);

  return (
    <div className="space-y-4">
      <h1>Products</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        products.map((product) => (
          <Card key={product.id}>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
          </Card>
        ))
      )}
    </div>
  );
};

export default ProductsPage;
```

## 📚 Dependencies

### Core Dependencies

- `@voilajsx/uikit` - React component library with FBCA support
- `@voilajsx/appkit` - Express backend framework with structured logging
- `react` & `react-dom` - React framework
- `react-router-dom` - Client-side routing
- `express` - Backend framework
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable loading

### Development Dependencies

- `vite` - Fast frontend build tool
- `typescript` - Type safety
- `nodemon` - Backend auto-reload
- `concurrently` - Run multiple commands
- `tsx` - TypeScript execution
- `eslint` - Code linting

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [UIKit Documentation](https://github.com/voilajsx/uikit)
- [AppKit Documentation](https://github.com/voilajsx/appkit)
- [FBCA Guide](https://docs.voilajsx.com/fbca)

## 💖 Support

If you like Helix Framework, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs and issues
- 💡 Contributing new features
- 📖 Improving documentation

---

Made with ❤️ by the VoilaJSX team

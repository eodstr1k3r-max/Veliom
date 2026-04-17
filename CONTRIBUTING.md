# Contributing to Veliom

Thank you for your interest in contributing to Veliom!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/veliom.git`
3. Install dependencies: `npm install`
4. Run tests: `npm test`
5. Make your changes

## Development

```bash
# Start dev server
npm run dev

# Run type checking
npm run typecheck

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
src/
├── core/           # Core rendering and component system
│   ├── renderer.ts # Virtual DOM implementation
│   ├── component.ts # Component creation and mounting
│   ├── control.ts  # Control flow (Show, For, etc.)
│   ├── lazy.ts     # Lazy loading
│   ├── suspense.ts  # Suspense component
│   ├── portal.ts   # Portal rendering
│   ├── refs.ts     # Ref system
│   └── error.ts    # Error handling
├── state/          # State management
│   ├── store.ts    # Signals and Store
│   ├── hooks.ts    # React-like hooks
│   └── lifecycle.ts # Lifecycle hooks
└── utils/         # Utilities
    └── benchmark.ts # Performance benchmarking
```

## Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Keep functions small and focused
- Write tests for new features
- Update documentation when needed

## Testing

Write tests for all new features:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    // Test implementation
  });
});
```

## Pull Request Process

1. Create a new branch for your feature
2. Make your changes
3. Add tests
4. Update documentation if needed
5. Submit a pull request

## Ideas for Contributions

- More test coverage
- Performance optimizations
- Additional examples
- Documentation improvements
- Bug fixes

## Questions?

Open an issue on GitHub!

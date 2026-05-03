# Contributing

Thank you for your interest in contributing to Theatrical.

## Getting Started

```bash
git clone https://github.com/brunohart/theatrical.git
cd theatrical

# Install dependencies for each package
cd packages/sdk && npm install && cd ../..
cd packages/cli && npm install && cd ../..
cd packages/events && npm install && cd ../..
cd packages/analytics && npm install && cd ../..
```

## Development

### Running tests

```bash
# Individual packages
cd packages/sdk && npx vitest run
cd packages/cli && npx vitest run
cd packages/events && npx vitest run
cd packages/analytics && npx vitest run

# Integration tests
npx vitest run tests/integration/

# Watch mode
cd packages/sdk && npx vitest
```

### Type checking

```bash
npx tsc --noEmit -p packages/sdk/tsconfig.json
npx tsc --noEmit -p packages/cli/tsconfig.json
```

## Conventions

- **Commit messages**: [Conventional Commits](https://www.conventionalcommits.org/) format
- **TypeScript**: Strict mode, JSDoc on all public APIs
- **Types**: Derive from Zod schemas via `z.infer<typeof schema>` — no parallel interfaces
- **Tests**: Vitest, realistic NZ cinema fixture data
- **Mock data**: Use real NZ cinema names (Embassy Theatre, Roxy Cinema) and NZD currency

## Package Structure

Each package follows the same layout:

```
packages/<name>/
├── src/          # Source code
├── tests/        # Test files matching src structure
├── package.json  # Package config with exports map
├── tsconfig.json # TypeScript config extending root
└── vitest.config.ts
```

## License

By contributing, you agree that your contributions will be licensed under the same license as the package you are contributing to (MIT for sdk/cli, BSL 1.1 for events/analytics/react/templates).

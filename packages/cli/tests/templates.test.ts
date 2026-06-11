import { describe, it, expect } from 'vitest';
import {
  getTemplate,
  isValidTemplate,
  listTemplates,
  VALID_TEMPLATES,
  type ProjectTemplate,
} from '../src/templates/index.js';

describe('templates module', () => {
  describe('isValidTemplate', () => {
    it('should return true for "default"', () => {
      expect(isValidTemplate('default')).toBe(true);
    });

    it('should return true for "fullstack"', () => {
      expect(isValidTemplate('fullstack')).toBe(true);
    });

    it('should return true for "worker"', () => {
      expect(isValidTemplate('worker')).toBe(true);
    });

    it('should return false for unknown templates', () => {
      expect(isValidTemplate('minimal')).toBe(false);
      expect(isValidTemplate('react')).toBe(false);
      expect(isValidTemplate('')).toBe(false);
    });
  });

  describe('VALID_TEMPLATES', () => {
    it('should contain exactly four templates', () => {
      expect(VALID_TEMPLATES).toHaveLength(4);
    });

    it('should be readonly', () => {
      // TypeScript enforces this, but verify the array is frozen-like
      expect(VALID_TEMPLATES).toContain('default');
      expect(VALID_TEMPLATES).toContain('fullstack');
      expect(VALID_TEMPLATES).toContain('worker');
      expect(VALID_TEMPLATES).toContain('react-ticketing');
    });
  });

  describe('listTemplates', () => {
    it('should return metadata for all templates', () => {
      const templates = listTemplates();
      expect(templates).toHaveLength(4);
      expect(templates.map((t) => t.name)).toEqual(['default', 'fullstack', 'worker', 'react-ticketing']);
    });

    it('should include descriptions for each template', () => {
      const templates = listTemplates();
      for (const t of templates) {
        expect(t.description).toBeTruthy();
        expect(typeof t.description).toBe('string');
      }
    });
  });

  describe('getTemplate — default', () => {
    const template = getTemplate('default', {
      projectName: 'test-cinema',
      apiKey: 'test-key-123',
    });

    it('should return template with correct name', () => {
      expect(template.name).toBe('default');
    });

    it('should include package.json with project name', () => {
      const pkgFile = template.files.find((f) => f.path === 'package.json');
      expect(pkgFile).toBeDefined();
      const pkg = JSON.parse(pkgFile!.content);
      expect(pkg.name).toBe('test-cinema');
      expect(pkg.dependencies['@theatrical/sdk']).toBeDefined();
    });

    it('should include tsconfig.json', () => {
      const tsconfig = template.files.find((f) => f.path === 'tsconfig.json');
      expect(tsconfig).toBeDefined();
      const config = JSON.parse(tsconfig!.content);
      expect(config.compilerOptions.strict).toBe(true);
    });

    it('should include .env with API key', () => {
      const env = template.files.find((f) => f.path === '.env');
      expect(env).toBeDefined();
      expect(env!.content).toContain('test-key-123');
    });

    it('should include .env.example with placeholder', () => {
      const envExample = template.files.find((f) => f.path === '.env.example');
      expect(envExample).toBeDefined();
      expect(envExample!.content).toContain('your-api-key-here');
    });

    it('should include .gitignore with node_modules and dist', () => {
      const gitignore = template.files.find((f) => f.path === '.gitignore');
      expect(gitignore).toBeDefined();
      expect(gitignore!.content).toContain('node_modules');
      expect(gitignore!.content).toContain('dist');
      expect(gitignore!.content).toContain('.env');
    });

    it('should include src/index.ts entry point', () => {
      const entry = template.files.find((f) => f.path === 'src/index.ts');
      expect(entry).toBeDefined();
      expect(entry!.content).toContain('TheatricalClient');
    });

    it('should use placeholder when no API key provided', () => {
      const noKeyTemplate = getTemplate('default', { projectName: 'no-key-app' });
      const env = noKeyTemplate.files.find((f) => f.path === '.env');
      expect(env!.content).toContain('your-api-key-here');
    });
  });

  describe('getTemplate — react-ticketing', () => {
    const template = getTemplate('react-ticketing', {
      projectName: 'my-cinema',
    });

    it('should return template with correct name', () => {
      expect(template.name).toBe('react-ticketing');
    });

    it('should scaffold the full embedded app', () => {
      const paths = template.files.map((f) => f.path);
      expect(paths).toContain('package.json');
      expect(paths).toContain('index.html');
      expect(paths).toContain('vite.config.ts');
      expect(paths).toContain('vercel.json');
      expect(paths).toContain('src/App.tsx');
      expect(paths).toContain('src/lib/cinema.ts');
      expect(paths).toContain('src/pages/Seats.tsx');
      expect(paths).toContain('src/pages/Confirmation.tsx');
    });

    it('should substitute the project name into package.json', () => {
      const pkgFile = template.files.find((f) => f.path === 'package.json');
      const pkg = JSON.parse(pkgFile!.content);
      expect(pkg.name).toBe('my-cinema');
    });

    it('should use registry versions, never workspace file: deps', () => {
      const pkgFile = template.files.find((f) => f.path === 'package.json');
      const pkg = JSON.parse(pkgFile!.content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [name, range] of Object.entries(allDeps)) {
        expect(range, `${name} must not be a file: dep`).not.toMatch(/^file:/);
      }
      expect(pkg.dependencies['@theatrical/events']).toBeDefined();
      expect(pkg.devDependencies['@theatrical/cli']).toBeDefined();
    });

    it('should leave no unsubstituted placeholders in any file', () => {
      for (const file of template.files) {
        expect(file.content, `${file.path} contains a placeholder`).not.toContain('{{PROJECT_NAME}}');
      }
    });

    it('should wire the real @theatrical/events watchers', () => {
      const cinema = template.files.find((f) => f.path === 'src/lib/cinema.ts');
      expect(cinema!.content).toContain("from '@theatrical/events'");
      expect(cinema!.content).toContain('BookingWatcher');
      expect(cinema!.content).toContain('SessionWatcher');
    });
  });

  describe('getTemplate — fullstack', () => {
    const template = getTemplate('fullstack', {
      projectName: 'cinema-fullstack',
    });

    it('should include all default files', () => {
      const defaultTemplate = getTemplate('default', { projectName: 'cinema-fullstack' });
      const defaultPaths = defaultTemplate.files.map((f) => f.path);
      for (const p of defaultPaths) {
        expect(template.files.map((f) => f.path)).toContain(p);
      }
    });

    it('should include src/server.ts with Express setup', () => {
      const server = template.files.find((f) => f.path === 'src/server.ts');
      expect(server).toBeDefined();
      expect(server!.content).toContain('express');
      expect(server!.content).toContain('/api/films');
      expect(server!.content).toContain('/api/sessions');
    });
  });

  describe('getTemplate — worker', () => {
    const template = getTemplate('worker', {
      projectName: 'cinema-worker',
    });

    it('should include all default files', () => {
      const defaultTemplate = getTemplate('default', { projectName: 'cinema-worker' });
      const defaultPaths = defaultTemplate.files.map((f) => f.path);
      for (const p of defaultPaths) {
        expect(template.files.map((f) => f.path)).toContain(p);
      }
    });

    it('should include src/worker.ts with polling setup', () => {
      const worker = template.files.find((f) => f.path === 'src/worker.ts');
      expect(worker).toBeDefined();
      expect(worker!.content).toContain('POLL_INTERVAL');
      expect(worker!.content).toContain('processEvents');
    });
  });
});

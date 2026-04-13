import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createProgram } from '../../src/index.js';

describe('theatrical init', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'theatrical-init-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should scaffold a default project with expected files', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'theatrical',
      'init',
      'test-cinema-app',
      '--no-install',
    ]);

    const projectDir = path.join(tmpDir, 'test-cinema-app');
    expect(fs.existsSync(projectDir)).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'tsconfig.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.env'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.env.example'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.gitignore'))).toBe(true);
  });

  it('should write correct package.json with project name and SDK dependency', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'theatrical',
      'init',
      'my-movie-app',
      '--no-install',
    ]);

    const pkgPath = path.join(tmpDir, 'my-movie-app', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(pkg.name).toBe('my-movie-app');
    expect(pkg.dependencies['@theatrical/sdk']).toBeDefined();
    expect(pkg.devDependencies.typescript).toBeDefined();
  });

  it('should include API key in .env when provided', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'theatrical',
      'init',
      'keyed-app',
      '--api-key',
      'test-key-12345',
      '--no-install',
    ]);

    const envPath = path.join(tmpDir, 'keyed-app', '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    expect(envContent).toContain('test-key-12345');
  });

  it('should scaffold fullstack template with server file', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'theatrical',
      'init',
      'fullstack-app',
      '--template',
      'fullstack',
      '--no-install',
    ]);

    const serverPath = path.join(tmpDir, 'fullstack-app', 'src', 'server.ts');
    expect(fs.existsSync(serverPath)).toBe(true);

    const serverContent = fs.readFileSync(serverPath, 'utf-8');
    expect(serverContent).toContain('express');
    expect(serverContent).toContain('TheatricalClient');
  });

  it('should scaffold worker template with worker file', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'theatrical',
      'init',
      'worker-app',
      '--template',
      'worker',
      '--no-install',
    ]);

    const workerPath = path.join(tmpDir, 'worker-app', 'src', 'worker.ts');
    expect(fs.existsSync(workerPath)).toBe(true);

    const workerContent = fs.readFileSync(workerPath, 'utf-8');
    expect(workerContent).toContain('POLL_INTERVAL');
  });

  it('should use custom directory when --directory is specified', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'theatrical',
      'init',
      'named-project',
      '--directory',
      'custom-dir',
      '--no-install',
    ]);

    expect(fs.existsSync(path.join(tmpDir, 'custom-dir'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'custom-dir', 'package.json'))).toBe(true);

    // Project name in package.json should still be the argument, not the directory
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'custom-dir', 'package.json'), 'utf-8')
    );
    expect(pkg.name).toBe('named-project');
  });

  it('should default project name to my-cinema-app when not provided', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'theatrical',
      'init',
      '--no-install',
    ]);

    const pkgPath = path.join(tmpDir, 'my-cinema-app', 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBe('my-cinema-app');
  });
});

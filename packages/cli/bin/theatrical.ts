#!/usr/bin/env node

/**
 * Binary entry point for the Theatrical CLI.
 *
 * This file is referenced in package.json's "bin" field and is the
 * executable that runs when users invoke `theatrical` from the terminal.
 *
 * Error handling wraps the entire program to ensure clean exit codes
 * and user-friendly error messages for unhandled failures.
 */

import { run } from '../src/index.js';

run().catch((err: Error) => {
  console.error(`\n  theatrical: ${err.message}\n`);

  if (process.env.THEATRICAL_VERBOSE === '1') {
    console.error(err.stack);
  }

  process.exit(1);
});

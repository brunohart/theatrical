#!/usr/bin/env node

/**
 * Binary entry point for the Theatrical CLI.
 * Referenced by package.json "bin"; runs when users invoke `theatrical`.
 */

import { run } from '../dist/index.js';

run().catch((err) => {
  console.error(`\n  theatrical: ${err.message}\n`);
  if (process.env.THEATRICAL_VERBOSE === '1') {
    console.error(err.stack);
  }
  process.exit(1);
});

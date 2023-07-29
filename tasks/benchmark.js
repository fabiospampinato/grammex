
/* IMPORT */

import benchmark from 'benchloop';
import fs from 'node:fs';
import {parse} from '../dist/index.js';
import JSON_GRAMMEX from './json.grammex.js';
import JSON_HERA from './json.hera.js';

/* HELPERS */

const JSON_SAMPLE = fs.readFileSync ( 'tasks/sample.json', 'utf8' );

/* MAIN */

benchmark.config ({
  iterations: 1000
});

benchmark ({
  name: 'grammex.parse.memoized',
  fn: () => {
    parse ( JSON_SAMPLE, JSON_GRAMMEX, {} );
  }
});

benchmark ({
  name: 'grammex.parse.unmemoized',
  fn: () => {
    parse ( JSON_SAMPLE, JSON_GRAMMEX, {}, { memoization: false } );
  }
});

benchmark ({
  name: 'hera.parse',
  fn: () => {
    JSON_HERA.parse ( JSON_SAMPLE );
  }
});

benchmark.summary ();

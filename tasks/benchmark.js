
/* IMPORT */

import benchmark from 'benchloop';
import fs from 'node:fs';
import {parse, validate} from '../dist/index.js';
import JSON_GRAMMAR from './grammar.js';

/* HELPERS */

const JSON_SAMPLE = fs.readFileSync ( 'tasks/sample.json', 'utf8' );

/* MAIN */

benchmark.config ({
  iterations: 1_000
});

benchmark ({
  name: 'grammex.memoized',
  fn: () => {
    parse ( JSON_SAMPLE, JSON_GRAMMAR );
  }
});

benchmark ({
  name: 'grammex.memoized.silent',
  fn: () => {
    parse ( JSON_SAMPLE, JSON_GRAMMAR, { silent: true } );
  }
});

benchmark ({
  name: 'grammex.unmemoized',
  fn: () => {
    parse ( JSON_SAMPLE, JSON_GRAMMAR, { memoization: false } );
  }
});

benchmark ({
  name: 'grammex.unmemoized.silent',
  fn: () => {
    parse ( JSON_SAMPLE, JSON_GRAMMAR, { memoization: false, silent: true } );
  }
});

benchmark ({
  name: 'json.parse',
  fn: () => {
    JSON.parse ( JSON_SAMPLE );
  }
});

benchmark.summary ();


/* IMPORT */

import {describe} from 'fava';
import {parse, validate, match, repeat, optional, star, plus, and, or, jump, negative, positive, lazy} from '../dist/index.js';

/* HELPERS */

const check = ( input, rule, context ) => {
  try {
    const output = parse ( input, rule, context );
    const error = undefined;
    return {output, error};
  } catch ( error ) {
    const output = [];
    return {output, error};
  }
};

/* MAIN */

describe ( 'Grammex', it => {

  describe ( 'parse', it => {

    it ( 'supports a string', t => {

      const r1 = check ( 'foo', 'foo' );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'bar', 'foo' );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

      const r3 = check ( 'fooa', 'foo.' );

      t.truthy ( r3.error );
      t.deepEqual ( r3.output, [] );

      const r4 = check ( 'foo', 'Foo' );

      t.truthy ( r4.error );
      t.deepEqual ( r4.output, [] );

      const r5 = check ( 'Foo', 'Foo' );

      t.falsy ( r5.error );
      t.deepEqual ( r5.output, [] );

    });

    it ( 'supports a regex', t => {

      const r1 = check ( 'foo', /f.o/ );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'bar', /f.o/ );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'supports an array', t => {

      const r1 = check ( 'foofoo', ['foo', /f.o/] );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'faofoo', ['foo', /f.o/] );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'supports a plain object', t => {

      const alt1 = 'boo';
      const alt2 = /f.o/;

      const r1 = check ( 'boo', { alt1, alt2 } );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'fao', { alt1, alt2 } );

      t.falsy ( r2.error );
      t.deepEqual ( r2.output, [] );

      const r3 = check ( 'faofoo', { alt1, alt2 } );

      t.truthy ( r3.error );
      t.deepEqual ( r3.output, [] );

    });

    it ( 'supports a regular rule', t => {

      const rule = match ( /foo/, 'out' );

      const r1 = check ( 'foo', rule );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['out'] );

      const r2 = check ( 'bar', rule );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'supports a lazy rule, explicitly', t => {

      const rule = match ( /foo/, 'out' );
      const lazyRule = lazy ( () => rule );

      const r1 = check ( 'foo', lazyRule );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['out'] );

      const r2 = check ( 'bar', lazyRule );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'supports a lazy rule, implicitly', t => {

      const rule = match ( /foo/, 'out' );
      const lazyRule = () => rule;

      const r1 = check ( 'foo', lazyRule );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['out'] );

      const r2 = check ( 'bar', lazyRule );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'checks if the entire input has been consumed', t => {

      const r1 = check ( 'foo', 'foo' );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'fooooo', 'foo' );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'throws an error mentioning the invalid index, simple grammar', t => {

      const a = star ( 'a' );

      const r1 = check ( 'b', a );

      t.is ( r1.error.message, 'Failed to parse at index 0' );

      const r2 = check ( 'aaab', a );

      t.is ( r2.error.message, 'Failed to parse at index 3' );

    });

    it ( 'throws an error mentioning the invalid index, complex grammar', t => {

      const blockStart = '[start]';
      const blockContent = lazy ( () => grammar );
      const blockEnd = '[end]';
      const block =  and ([ blockStart, blockContent, blockEnd ]);
      const car = 'car';
      const cat = 'cat';
      const grammar = star ( or ([ block, car, cat ]) );

      const r1 = check ( '[start]car', grammar );

      t.is ( r1.error.message, 'Failed to parse at index 10' );

      const r2 = check ( '[start]car[end]cap', grammar );

      t.is ( r2.error.message, 'Failed to parse at index 15' );

      const r3 = check ( 'carcatcarcat[start][start]car[end]car', grammar );

      t.is ( r3.error.message, 'Failed to parse at index 37' );

    });

  });

  describe ( 'validate', it => {

    it ( 'returns a boolean', t => {

      const r1 = validate ( 'foo', 'foo' );

      t.true ( r1 );

      const r2 = validate ( 'bar', 'foo' );

      t.false ( r2 );

    });

    it ( 'does call handlers at all, to allow them to throw', t => {

      t.plan ( 8 );

      const r1 = validate ( 'foo', match ( 'foo', () => t.pass () ) );

      t.true ( r1 );

      const r2 = validate ( 'foo', match ( /foo/, () => t.pass () ) );

      t.true ( r2 );

      const r3 = validate ( 'ooo', star ( 'o', () => t.pass () ) );

      t.true ( r3 );

      const r4 = validate ( 'ooo', match ( ['o'], () => t.pass () ) );

      t.true ( r4 );

    });

  });

  describe ( 'match', it => {

    it ( 'creates a rule based on a regex', t => {

      const rule1 = match ( /f(o)o/, ( ...args ) => args.join ( ',' ) );
      const rule2 = match ( /b(ar)/, ( ...args ) => args.join ( ',' ) );

      const r1 = check ( 'foobar', [rule1, rule2] );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['foo,o,foobar,0', 'bar,ar,foobar,3'] );

    });

    it ( 'creates a rule based on a string', t => {

      const rule = match ( 'f(o)o' );

      const r1 = check ( 'f(o)o', [rule] );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'foo', [rule] );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'creates a rule based on a list of characters', t => {

      const rule = match ( ['f', 'o'], _ => _ );

      const r1 = check ( 'foo', [rule] );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['foo'] );

    });

    it ( 'does not hang on regexes that do not consume input', t => {

      const rule = match ( /.?/, '0' );

      const r1 = check ( '', rule );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['0'] );

    });

    it ( 'does not hang on strings that do not consume input', t => {

      const rule = match ( '', '0' );

      const r1 = check ( '', rule );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['0'] );

    });

    it ( 'supports not returning any output from the handler', t => {

      const rule1 = match ( /foo/, () => {} );
      const rule2 = match ( 'foo', () => {} );
      const rule3 = match ( ['f', 'o'], () => {} );

      const result1 = check ( 'foo', rule1 );
      const result2 = check ( 'foo', rule2 );
      const result3 = check ( 'foo', rule3 );

      t.falsy ( result1.error );
      t.falsy ( result2.error );
      t.falsy ( result3.error );

      t.deepEqual ( result1.output, [] );
      t.deepEqual ( result2.output, [] );
      t.deepEqual ( result3.output, [] );

    });

    it ( 'throws on invalid lists of characters contaning', t => {

      try {

        match ([ '' ]);

      } catch ( error ) {

        t.is ( error.message, 'Invalid character: ""' );

      }

      try {

        match ([ 'foo' ]);

      } catch ( error ) {

        t.is ( error.message, 'Invalid character: "foo"' );

      }

    });

  });

  describe ( 'repeat', it => {

    it ( 'creates a rule that matches between min and max times', t => {

      const rule = match ( /o/, '0' );

      const r1 = check ( 'ooo', repeat ( rule, 1, 5 ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['0', '0', '0'] );

      const r2 = check ( '', repeat ( rule, 1, 5 ) );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

      const r3 = check ( 'oooooo', repeat ( rule, 1, 5 ) );

      t.truthy ( r3.error );
      t.deepEqual ( r3.output, [] );

    });

    it ( 'does not backtrack', t => {

      const rule = match ( /o/, '0' );
      const single = 'o';

      const r1 = check ( 'ooo', and ([ repeat ( rule, 1, 3 ), single ]) );

      t.truthy ( r1.error );
      t.deepEqual ( r1.output, [] );

    });

    it ( 'does not hang on rules that do not consume input', t => {

      const rule = match ( /^/, '0' );

      const r1 = check ( '', repeat ( rule, 1, 5 ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['0'] );

      const r2 = check ( 'ooo', and ([ repeat ( rule, 1, 5 ), 'ooo' ]) );

      t.falsy ( r2.error );
      t.deepEqual ( r2.output, ['0'] );

    });

    it ( 'supports transforming output', t => {

      const rule = match ( /o/, '0' );

      const r1 = check ( 'ooo', repeat ( rule, 1, 3, tokens => ({ children: tokens }) ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [{ children: ['0', '0', '0'] }] );

    });

  });

  describe ( 'optional', it => {

    it ( 'creates a rule that matches between 0 and 1 times', t => {

      const rule = match ( /o/, '0' );

      const r1 = check ( '', optional ( rule ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'o', optional ( rule ) );

      t.falsy ( r2.error );
      t.deepEqual ( r2.output, ['0'] );

      const r3 = check ( 'oo', optional ( rule ) );

      t.truthy ( r3.error );
      t.deepEqual ( r3.output, [] );

    });

    it ( 'does not backtrack', t => {

      const rule = match ( /o/, '0' );
      const single = 'o';

      const r1 = check ( 'o', and ([ optional ( rule ), single ]) );

      t.truthy ( r1.error );
      t.deepEqual ( r1.output, [] );

    });

    it ( 'supports transforming output', t => {

      const rule = match ( /o/, '0' );

      const r1 = check ( 'o', optional ( rule, tokens => ({ children: tokens }) ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [{ children: ['0'] }] );

    });

  });

  describe ( 'star', it => {

    it ( 'creates a rule that matches between 0 and Infinity times', t => {

      const rule = match ( /o/, '0' );

      const r1 = check ( '', star ( rule ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'o', star ( rule ) );

      t.falsy ( r2.error );
      t.deepEqual ( r2.output, ['0'] );

      const r3 = check ( 'ooooo', star ( rule ) );

      t.falsy ( r3.error );
      t.deepEqual ( r3.output, ['0', '0', '0', '0', '0'] );

    });

    it ( 'does not backtrack', t => {

      const rule = match ( /o/, '0' );
      const single = 'o';

      const r1 = check ( 'ooooo', and ([ star ( rule ), single ]) );

      t.truthy ( r1.error );
      t.deepEqual ( r1.output, [] );

    });

    it ( 'supports transforming output', t => {

      const rule = match ( /o/, '0' );

      const r1 = check ( 'ooo', star ( rule, tokens => ({ children: tokens }) ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [{ children: ['0', '0', '0'] }] );

    });

  });

  describe ( 'plus', it => {

    it ( 'creates a rule that matches between 1 and Infinity times', t => {

      const rule = match ( /o/, '0' );

      const r1 = check ( '', plus ( rule ) );

      t.truthy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'o', plus ( rule ) );

      t.falsy ( r2.error );
      t.deepEqual ( r2.output, ['0'] );

      const r3 = check ( 'ooooo', plus ( rule ) );

      t.falsy ( r3.error );
      t.deepEqual ( r3.output, ['0', '0', '0', '0', '0'] );

    });

    it ( 'does not backtrack', t => {

      const rule = match ( /o/, '0' );
      const single = 'o';

      const r1 = check ( 'ooooo', and ([ plus ( rule ), single ]) );

      t.truthy ( r1.error );
      t.deepEqual ( r1.output, [] );

    });

    it ( 'supports transforming output', t => {

      const rule = match ( /o/, '0' );

      const r1 = check ( 'ooo', plus ( rule, tokens => ({ children: tokens }) ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [{ children: ['0', '0', '0'] }] );

    });

  });

  describe ( 'and', it => {

    it ( 'creates a rule that matches if all the rules match', t => {

      const r1 = check ( 'foofoo', and ([ 'foo', /f.o/ ]) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'faofoo', and ([ 'foo', /f.o/ ]) );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'supports transforming output', t => {

      const rule1 = match ( 'foo', 'foo' );
      const rule2 = match ( /f.o/, 'f.o' );

      const r1 = check ( 'foofoo', and ( [rule1, rule2], tokens => ({ children: tokens }) ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [{ children: ['foo', 'f.o'] }] );

    });

  });

  describe ( 'or', it => {

    it ( 'creates a rule that matches if any of the rules match', t => {

      const alt1 = 'boo';
      const alt2 = /f.o/;

      const r1 = check ( 'boo', or ([ alt1, alt2 ]) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'fao', or ([ alt1, alt2 ]) );

      t.falsy ( r2.error );
      t.deepEqual ( r2.output, [] );

      const r3 = check ( 'faofoo', or ([ alt1, alt2 ]) );

      t.truthy ( r3.error );
      t.deepEqual ( r3.output, [] );

    });

    it ( 'supports transforming output', t => {

      const alt1 = match ( 'boo', 'boo' );
      const alt2 = match ( /f.o/, 'f.o' );

      const r1 = check ( 'boo', or ( [alt1, alt2], tokens => ({ children: tokens }) ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [{ children: ['boo'] }] );

    });

  });

  describe ( 'jump', it => {

    it ( 'creates a rule that matches a rule looked up from the table', t => {

      const foo = match ( 'foo', 'foo' );
      const bar = match ( 'bar', 'bar' );
      const table = jump ({ 'f': foo, 'b': bar });

      const r1 = check ( 'foo', table );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['foo'] );

      const r2 = check ( 'bar', table );

      t.falsy ( r2.error );
      t.deepEqual ( r2.output, ['bar'] );

      const r3 = check ( 'baz', table );

      t.truthy ( r3.error );
      t.deepEqual ( r3.output, [] );

      const r4 = check ( 'qux', table );

      t.truthy ( r4.error );
      t.deepEqual ( r4.output, [] );

    });

    it ( 'supports transforming output', t => {

      const alt1 = match ( 'foo', 'foo' );
      const alt2 = match ( 'bar', 'bar' );

      const r1 = check ( 'foo', jump ( {'f': alt1, 'b': alt2}, tokens => ({ children: tokens }) ) );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [{ children: ['foo'] }] );

    });

    it ( 'throws on invalid jump characters', t => {

      try {

        jump ({ '': match ( 'foo' ) });

      } catch ( error ) {

        t.is ( error.message, 'Invalid jump character: ""' );

      }

      try {

        jump ({ 'foo': match ( 'foo' ) });

      } catch ( error ) {

        t.is ( error.message, 'Invalid jump character: "foo"' );

      }

    });

  });

  describe ( 'negative', it => {

    it ( 'creates a negative lookahead rule', t => {

      const lookahead = /bar/;
      const rule = /.*/;

      const r1 = check ( 'foo', [negative ( lookahead ), rule] );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'bar', [negative ( lookahead ), rule] );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'does not keep the output of the rule', t => {

      const lookahead = match ( /bar/, '0' );
      const rule = match ( /.*/, '1' );

      const r1 = check ( 'foo', [negative ( lookahead ), rule] );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['1'] );

    });

  });

  describe ( 'positive', it => {

    it ( 'creates a positive lookahead rule', t => {

      const lookahead = /bar/;
      const rule = /.*/;

      const r1 = check ( 'bar', [positive ( lookahead ), rule] );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, [] );

      const r2 = check ( 'foo', [positive ( lookahead ), rule] );

      t.truthy ( r2.error );
      t.deepEqual ( r2.output, [] );

    });

    it ( 'does not keep the output of the rule', t => {

      const lookahead = match ( /bar/, '0' );
      const rule = match ( /.*/, '1' );

      const r1 = check ( 'bar', [positive ( lookahead ), rule] );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['1'] );

    });

  });

  describe ( 'lazy', it => {

    it ( 'creates a lazy rule, working around circular references', t => {

      const rule1 = lazy ( () => rule2 );
      const rule2 = match ( /bar/, String );

      const r1 = check ( 'bar', [rule1] );

      t.falsy ( r1.error );
      t.deepEqual ( r1.output, ['bar'] );

    });

  });

  it ( 'can implement the timestamp grammar', t => {

    const O = optional;

    //URL: https://github.com/xored/peg/blob/master/docs/grammar-examples.md#grammar-examples

    const Hour = /[0-1][0-9]|2[0-4]/;
    const Minute = /[0-5][0-9]/;
    const Second = /[0-5][0-9]|60/;
    const Fraction = /[.,][0-9]+/;
    const IsoTz = or ([ 'Z', [/[+-]/, Hour, O([O(':'), Minute])] ]);
    const TzL = /[A-Z]/;
    const TzAbbr = [TzL, TzL, O([TzL, O([TzL, O(TzL)])])];
    const TZ = {IsoTz, TzAbbr};
    const HM = [Hour, ':', Minute, O(Fraction)];
    const HMS = [Hour, ':', Minute, ':', Second, O(Fraction)];
    const Time = [O(/T ?/), {HMS, HM}, O([/ ?/, TZ])];

    const Year = /[0-9][0-9][0-9][0-9]/;
    const Month = /0[1-9]|1[0-2]/;
    const Day = /0[1-9]|[1-2][0-9]|3[0-1]/;
    const Date = [Year, '-', Month, O(['-', Day])];

    const DateTime = [Date, / ?/, Time];

    const MonthAbbr = /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec/;
    const WeekDayAbbr = /Mon|Tu|Tue|Tues|Wed|Th|Thu|Thur|Thurs|Fri|Sat|Sun/;
    const FreeDateTime = [WeekDayAbbr, ' ', MonthAbbr, ' ', Day, ' ', Time, ' ', Year];

    const Timestamp = {DateTime, FreeDateTime};

    t.true ( validate ( '2009-09-22T06:59:28', Timestamp ) );
    t.true ( validate ( '2009-09-22 06:59:28', Timestamp ) );
    t.true ( validate ( 'Fri Jun 17 03:50:56 PDT 2011', Timestamp ) );
    t.true ( validate ( '2010-10-26 10:00:53.360', Timestamp ) );

    t.false ( validate ( '2009--09-22T06:59:28', Timestamp ) );
    t.false ( validate ( '2009-09-22Z06:59:28', Timestamp ) );
    t.false ( validate ( '2009-09-22T06.59:28', Timestamp ) );

    t.false ( validate ( '2009-09-22 06:59:280', Timestamp ) );
    t.false ( validate ( '2009-09-22 06:590:28', Timestamp ) );
    t.false ( validate ( '2009-09-22 060:59:28', Timestamp ) );

    t.false ( validate ( 'Fri Jun 170 03:50:56 PDT 2011', Timestamp ) );
    t.false ( validate ( 'Fri Juns 17 03:50:56 PDT 2011', Timestamp ) );
    t.false ( validate ( 'Friz Jun 17 03:50:56 PDT 2011', Timestamp ) );

  });

});

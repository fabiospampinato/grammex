
/* MAIN */

type CompoundHandler<T> = ( token: T[] ) => T | undefined;
type PrimitiveHandler<T> = ( ...args: string[] ) => T | undefined; // ( ...args: [consumed: string, ...groups: string[], input: string, index: string] ) => T | undefined

type ExplicitRule<T> = ( state: State<T> ) => boolean;
type ImplicitRule<T> = string | RegExp | Rule<T>[] | { [Key in string]: Rule<T> } | (() => Rule<T>);
type Rule<T> = ExplicitRule<T> | ImplicitRule<T>;

type Cache<T> = Record<number, { indexMax: number, queue: (number | CacheValue<T>)[], store?: Map<number, CacheValue<T>> }>;
type CacheValue<T> = { index: number, output?: T[] } | number | false;
type Options = { memoization?: boolean, silent?: boolean };
type State<T> = { cache: Cache<T>, input: string, index: number, indexBacktrackMax: number, options: Options, output: T[] };

/* EXPORT */

export type {CompoundHandler, PrimitiveHandler, ExplicitRule, ImplicitRule, Rule, Cache, CacheValue, Options, State};


/* MAIN */

type CompoundHandler<T> = ( token: T[] ) => T | undefined;
type PrimitiveHandler<T> = ( ...args: string[] ) => T | undefined; // ( ...args: [consumed: string, ...groups: string[], input: string, index: string] ) => T | undefined

type ExplicitRule<T> = ( state: State<T> ) => boolean;
type ImplicitRule<T> = string | RegExp | Rule<T>[] | { [Key in string]: Rule<T> } | (() => Rule<T>);
type Rule<T> = ExplicitRule<T> | ImplicitRule<T>;

type Cache<T> = Record<number, Map<number, { index: number, output?: T[] } | number | false>>;
type Options = { memoization?: boolean, silent?: boolean };
type State<T> = { cache: Cache<T>, input: string, index: number, indexMax: number, options: Options, output: T[] };

/* EXPORT */

export type {CompoundHandler, PrimitiveHandler, ExplicitRule, ImplicitRule, Rule, Cache, Options, State};

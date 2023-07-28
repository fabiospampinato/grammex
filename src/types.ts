
/* MAIN */

type CompoundHandler<T> = ( token: T[] ) => T;
type PrimitiveHandler<T> = ( ...args: string[] ) => T; // ( ...args: [consumed: string, ...groups: string[], input: string, index: string] ) => T //TODO: Change this, pass on the context also, maybe

type ExplicitRule<T, U> = ( state: State<T, U> ) => boolean;
type ImplicitRule<T, U> = string | RegExp | Rule<T, U>[] | { [Key in string]: Rule<T, U> };
type Rule<T, U> = ExplicitRule<T, U> | ImplicitRule<T, U>;

type Cache<T> = Record<symbol, Record<number, { index: number, output: T[] } | false>>;
type State<T, U> = { cache: Cache<T>, input: string, index: number, indexMax: number, options: U, output: T[] };

/* EXPORT */

export type {CompoundHandler, PrimitiveHandler, ExplicitRule, ImplicitRule, Rule, Cache, State};

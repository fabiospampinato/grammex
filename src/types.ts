
/* MAIN */

type RepeatHandler<T> = ( tokens: T[] ) => T;
type OptionalHandler<T> = ( token?: T ) => T;
type StarHandler<T> = ( tokens: T[] ) => T;
type PlusHandler<T> = ( tokens: T[] ) => T;
type AndHandler<T> = ( tokens: T[] ) => T;
type OrHandler<T> = ( token: T[] ) => T;
type MatchHandler<T> = ( ...args: string[] ) => T; // ( ...args: [consumed: string, ...groups: string[], input: string, index: string] ) => T //TODO: Change this, pass on the context also, maybe

type ExplicitRule<T, U> = ( state: State<T, U> ) => boolean;
type ImplicitRule<T, U> = string | RegExp | Rule<T, U>[] | { [Key in string]: Rule<T, U> };
type Rule<T, U> = ExplicitRule<T, U> | ImplicitRule<T, U>;

type State<T, U> = { dry: number, input: string, index: number, indexMax: number, options: U, output: T[] };

/* EXPORT */

export type {RepeatHandler, OptionalHandler, StarHandler, PlusHandler, AndHandler, OrHandler, MatchHandler, ExplicitRule, ImplicitRule, Rule, State};


/* MAIN */

type MatchHandler<T> = ( ...args: string[] ) => T; // ( ...args: [consumed: string, ...groups: string[], input: string, index: string] ) => T

type EagerRule<T, U> = ( state: State<T, U> ) => boolean;

type LazyRule<T, U> = () => EagerRule<T, U>;

type ImplicitRule = string | RegExp | ImplicitRule[] | { [Key in string]: ImplicitRule };

type Rule<T, U> = EagerRule<T, U> | LazyRule<T, U> | ImplicitRule;

type State<T, U> = { options: U, input: string, index: number, output: T[] };

/* EXPORT */

export type {MatchHandler, EagerRule, LazyRule, ImplicitRule, Rule, State};

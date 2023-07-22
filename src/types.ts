
/* MAIN */

type MatchHandler<T> = ( ...args: string[] ) => T; // ( ...args: [consumed: string, ...groups: string[], input: string, index: string] ) => T

type EagerRule<T, U> = ( state: State<T, U> ) => boolean;

type LazyRule<T, U> = () => Rule<T, U>;

type ImplicitRule<T, U> = string | RegExp | Rule<T, U>[] | { [Key in string]: Rule<T, U> };

type Rule<T, U> = EagerRule<T, U> | LazyRule<T, U> | ImplicitRule<T, U>;

type State<T, U> = { options: U, input: string, index: number, indexMax: number, output: T[] };

/* EXPORT */

export type {MatchHandler, EagerRule, LazyRule, ImplicitRule, Rule, State};

import { Mutation } from "./watch"

export class ChangeEvent<S> {
   trace?: string;
   constructor(
      public subject: S,
      public newState?: S extends () => infer T ? T : S,
      public oldState?: S extends () => infer T ? T : S,
      public mutations?: Mutation[]
   ) { }
}

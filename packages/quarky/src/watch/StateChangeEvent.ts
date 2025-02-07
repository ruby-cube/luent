import { MutationRecord } from "./watch"

export class StateChangeEvent<S> {
   trace?: string;
   constructor(
      public subject: S,
      public newState?: S extends () => infer T ? T : S,
      public oldState?: S extends () => infer T ? T : S,
      public mutations?: MutationRecord[]
   ) { }
}

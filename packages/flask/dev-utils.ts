import { DevReturnType } from "@rue/dev";
import { MiscObj } from "@rue/types";

export type DevHookCaster<F extends (...args: any[]) => MiscObj | void> = DevReturnType<F> extends any[] ? DevReturnType<F>[0] : never;
export type DevHookListener<F extends (...args: any[]) => MiscObj | void> = DevReturnType<F> extends any[] ? DevReturnType<F>[1] : never;

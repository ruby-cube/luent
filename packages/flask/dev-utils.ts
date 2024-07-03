import { DevReturnType } from "@rue/dev";
import { AnyObject } from "@rue/types";

export type DevHookCaster<F extends (...args: any[]) => AnyObject | void> = DevReturnType<F> extends any[] ? DevReturnType<F>[0] : never;
export type DevHookListener<F extends (...args: any[]) => AnyObject | void> = DevReturnType<F> extends any[] ? DevReturnType<F>[1] : never;

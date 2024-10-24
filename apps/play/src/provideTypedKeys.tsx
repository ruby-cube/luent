import { NodeEntity, TypedKey } from "@rue/lumo";

const FROG = 'frog' as TypedKey<{
    name: string,
    qualities: string[],
    setName(name: string): void
}>




function Context<T>(...args: T[]) {

}

Context([FROG,])

const my = [FROG, null]
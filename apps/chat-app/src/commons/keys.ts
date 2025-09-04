import { CommonsKey } from "@rue/lumo";
import { Ion } from "@rue/quarky";

export type User = {
   name: string,
   email: string
}

export const $USER = CommonsKey<Ion<User | null>>('user')
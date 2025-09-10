import { CommonsKey } from "@rue/lumo";
import { Ion } from "@rue/quarky";

export type User = {
   name: string,
   email: string,
   lastSeenMessageID?: string
}

export const USER = CommonsKey<User>('user')
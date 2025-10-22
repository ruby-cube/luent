import { NubKey } from "@rue/lumo";
import { Ionized } from "@rue/quarky";


export type User = {
   id: string,
   name: string,
   email: string,
   lastSeenMessageID: string | null
}

export const USER = NubKey<User>('user')
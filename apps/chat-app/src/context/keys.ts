import { ContextKey } from "@rue/luent";
import { Ionized } from "@rue/quarky";


export type User = {
   id: string,
   name: string,
   email: string,
   lastSeenMessageID: string | null
}

export const USER = ContextKey<User>('user')
import { ContextKey } from "luent";
import { Ionized } from "@luent/quarky";


export type User = {
   id: string,
   name: string,
   email: string,
   lastSeenMessageID: string | null
}

export const USER = ContextKey<User>('user')
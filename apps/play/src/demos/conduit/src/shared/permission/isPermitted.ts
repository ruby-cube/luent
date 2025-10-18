import { fromRoot } from "@rue/lumo";
import { Ion } from "@rue/quarky";

type Permissions = typeof permissions

const permissions = {
   article: {
      like: isUser,
      create: isUser,

      update: isAuthor,
      delete: isAuthor,
   },
   profile: {
      follow: isUser,
      update: isOwner
   },
   comment: {
      create: isUser,
      delete: isAuthor
   }
}

function isUser(user: User | null) {
   return !!user;
}

function isAuthor(user: User | null, context: { authorID: string } | undefined) {
   if (!context || !('authorID' in context)) throw new Error('must provide context with authorID')
   return user?.id === context.authorID
}

function isOwner(user: User | null, context: { ownerID: string } | undefined) {
   if (!context || !('ownerID' in context)) throw new Error('must provide context with owner')
   return user?.id === context.ownerID
}


type PermissionContext<T = 'article'> = T extends 'comment' | 'article' ? { authorID: string } : { ownerID: string }

isPermitted.user = RootCommonsKey<Ion<User>>()

export function isPermitted<T extends keyof Permissions>(target: T, action: keyof Permissions[T], context?: PermissionContext<T>): boolean {
   const $user = fromRoot(isPermitted.user)
   return permissions[target][action]($user(), context)
}

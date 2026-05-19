import { Node as ASTNode, visitorKeys } from "oxc-parser"

// AI generated

type BaseNode = { type: string }

type NonNull<T> = Exclude<T, null | undefined>

type IsChildValue<V, AllNodes extends BaseNode> =
   [Extract<NonNull<V>, AllNodes>] extends [never]
      ? [Extract<NonNull<V>, readonly AllNodes[]>] extends [never]
         ? [Extract<NonNull<V>, AllNodes[]>] extends [never]
            ? false
            : true
         : true
      : true

type ChildKeyUnion<Node, AllNodes extends BaseNode> = {
   [K in keyof Node]-?: K extends "parent"
      ? never
      : IsChildValue<Node[K], AllNodes> extends true
         ? K
         : never
}[keyof Node] & string

type UnionToIntersection<U> =
   (U extends unknown ? (x: U) => 0 : never) extends (x: infer I) => 0 ? I : never

type LastInUnion<U> =
   UnionToIntersection<U extends unknown ? (x: U) => 0 : never> extends (x: infer L) => 0 ? L : never

type UnionToTuple<U, Last = LastInUnion<U>> =
   [U] extends [never] ? [] : [...UnionToTuple<Exclude<U, Last>>, Last]

type NodeByType<AllNodes extends BaseNode, T extends AllNodes["type"]> =
   Extract<AllNodes, { type: T }>

type ChildKeyTuple<Node, AllNodes extends BaseNode> = UnionToTuple<ChildKeyUnion<Node, AllNodes>>

export type ChildKeyTuplesByNodeType<AllNodes extends BaseNode> = {
   [T in AllNodes["type"]]: ChildKeyTuple<NodeByType<AllNodes, T>, AllNodes>
}

export type OxcChildKeyTuplesByNodeType = ChildKeyTuplesByNodeType<ASTNode>

// TODO: visitorKeys from oxc is missing 'hashbang' for Program; maybe missing other keys
export const CHILD_KEYS: OxcChildKeyTuplesByNodeType = visitorKeys

// {
//    ...(visitorKeys as OxcChildKeyTuplesByNodeType),
//    Program: [...(visitorKeys.Program ?? []), 'hashbang'] as OxcChildKeyTuplesByNodeType['Program'],
// }

const IS_DEV =
   (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== "production"

export function assertChildKeysDev(map: OxcChildKeyTuplesByNodeType) {
   for (const [nodeType, keys] of Object.entries(map)) {
      const canonicalKeys = [...(visitorKeys[nodeType] ?? [])]
      if (nodeType === 'Program' && !canonicalKeys.includes('hashbang')) {
         canonicalKeys.push('hashbang')
      }

      for (let i = 0; i < keys.length; i++) {
         const key = keys[i]
         if ((key as string) === "parent") {
            throw new Error(`CHILD_KEYS[${nodeType}] must not include \"parent\"`)
         }
         if (!canonicalKeys.includes(key)) {
            throw new Error(`CHILD_KEYS[${nodeType}] includes unknown child key \"${key}\"`)
         }
      }
   }
}

if (IS_DEV) {
   assertChildKeysDev(CHILD_KEYS)
}

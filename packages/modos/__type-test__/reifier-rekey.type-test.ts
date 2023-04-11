import { extend } from "@vue/shared";
import { $type } from "../../types";
import { keyCollisionCheck, KeyCollisionCheck, roleCollisionCheck } from "../../etre/reifier";
import { $val, Data, defineRole, Role, _Role, Rekey, $Role, Core, Prereqs, _PREREQS_ } from "../../etre/Role";
import { $v } from "../../../../OLD/x_preactive";

type PreBullFrog = Role<typeof $BullFrog>

export const $PreBullFrog = defineRole({
    $construct() {
        return {
            woo_oo: "bully",
            personality: "bull"
        }
    },
})

type BullFrog = Role<typeof $BullFrog>

export const $BullFrog = defineRole({
    prereqs: {
        $PreBullFrog
    },
    $construct() {
        return {
            woo_oo: "bully",
            personality: "bull"
        }
    },
})





type SwampFrogData = {
    woo_oo: () => void
}

export type SwampFrog = Role<typeof $SwampFrog>;

export const $SwampFrog = defineRole({
    prereqs: {
        $BullFrog,
    },

    $construct(data: Data<SwampFrogData>) {
        const { woo_oo } = data;
        return {
            woo_oo,
        }
    },
})

{
    type RekeyMap = {
        $CoreRole: { woo_oo: "oo_oo" }
    }

    type RekeyedSwampFrog = Rekey<typeof $SwampFrog, RekeyMap["$CoreRole"]>

    const createSwampFrog = $SwampFrog.reifier((data) => {
        const { props: { personality, woo_oo } } = $BullFrog.confer()
        const { props: { woo_oo: oo_oo } } = $SwampFrog.confer(data)
        return {
            personality,
            woo_oo,
            oo_oo
        }
    }, (!__DEV__) || {
        __prereqs__: {
            $BullFrog,
            $PreBullFrog
        },
        __rekey__: $type as RekeyMap
    })

    const swampFrog = createSwampFrog({ woo_oo: () => { } })
    swampFrog.woo_oo
    swampFrog.personality
    swampFrog.oo_oo



    const some = $val as RekeyedSwampFrog
    some.oo_oo
    some.personality
    some.woo_oo

}



{ // detect key collisions

    
    const createSwampFrog = $SwampFrog.reifier((data) => {
        const { props: { personality: personalityType } } = $PreBullFrog.confer();
        const { props: { personality, woo_oo } } = $BullFrog.confer()
        const { props: { woo_oo: oo_oo } } = $SwampFrog.confer(data)
        return {
            personality,
            woo_oo,
            oo_oo,
            personalityType
        }
    }, (!__DEV__) || {
        __prereqs__: {
            $BullFrog,
            $PreBullFrog
        },
        __rekey__: $type as RekeyMap
    })

    
    type RekeyMap = {
        $CoreRole: { woo_oo: "oo_oo" }
        $PreBullFrog: { personality: "personalityType" }
    }

    type RekeyedSwampFrog = Rekey<typeof $SwampFrog, RekeyMap["$CoreRole"]> //FIX this only rekeys $CoreRole, not $PreBullFrog
  
    if (__DEV__){
        keyCollisionCheck($SwampFrog, true, <RekeyMap>$type);
        roleCollisionCheck($SwampFrog);
    }
   

    // type RoleCollisions = RoleCollisionCheck<typeof $SwampFrog>;


    // type RoleCollisionCheck<R extends $Role> = {[Key in (keyof PrereqConfig<R> & keyof SecondLevelPrereqConfigs<R>)]: "collision"} & (R extends { [_PREREQS_]: infer P } ? P extends { [key: string]: infer R } ? R extends $Role ? RoleCollisionCheck<R> : never : {} : never);
    // { [Key in P]: "collision" } & (R extends { [_PREREQS_]: infer P } ? P extends { [key: string]: infer R } ? R extends $Role ? KeyCollisionCheck<R> : never : {} : never);
    // ("a" | "b" | "c") & ("c" | "d") & ("d")

    // type KeysOfPreqreqs<R> = R extends {[_PREREQS_]: infer P} ? P extends $Role ? 
    // type PrereqConfig<R extends $Role> = R extends { [_PREREQS_]: infer P } ? P : {};


    // type PrereqNames<R extends $Role> = R extends { [_PREREQS_]: infer P } ? P extends { [Key in infer N]: $Role } ? N : never : never
    // type PrereqConfigs<R extends $Role> = R extends { [_PREREQS_]: infer P } ? P extends { [key: string]: infer R } ? P & (R extends $Role ? PrereqConfigs<R> : {}) : {} : {}
    // type SecondLevelPrereqConfigs<R extends $Role> = R extends { [_PREREQS_]: infer P } ? P extends { [key: string]: infer R } ? (R extends $Role ? PrereqConfigs<R> : {}) : {} : {}

    const swampFrog = createSwampFrog({ woo_oo: () => { } })
    swampFrog.woo_oo
    swampFrog.personality
    swampFrog.oo_oo



    const some = $val as RekeyedSwampFrog
    some.oo_oo
    some.personality
    some.woo_oo

}
import { $type } from "../../types";
import { IReactive } from "../../paravue/reactivity";
import { $val, Data, defineRole, Interface, PrivateRole, Role } from "../../etre/Role";
import { onComposed } from "../../etre/reifier";



export const BULLY = Symbol();
type BullFrog = Role<typeof $BullFrog>
type _BullFrog = PrivateRole<typeof $BullFrog>

export const $BullFrog = defineRole({
    marker: { [BULLY]: true },

    $construct() {
        onComposed(() => {

        });


        return {
            personality: "bully"
        }
    },

    burp() {
        return this.personality === "";
    }
})



type IGrumpyFrog = Interface<typeof $GrumpyFrog>

type GrumpyFrog = Role<typeof $GrumpyFrog>;

export const $GrumpyFrog = defineRole({
    interface: $type as IReactive & {
        hey: () => {}
    },
    prereqs: {
        $BullFrog
    },


    grump() { return "humph" }
})




export const SWAMP_FROG = Symbol();
type SwampFrogData = {
    help: string
}

export type SwampFrog = Role<typeof $SwampFrog>;

export const $SwampFrog = defineRole({
    marker: { [SWAMP_FROG]: true },
    interface: $type as IReactive & {
        smurfs: (...args: any) => {}
    },
    implements: $type as Pick<IGrumpyFrog, "hey">,
    prereqs: {
        $GrumpyFrog,
    },

    $construct(data: Data<SwampFrogData>) {
        const { help } = data;
        return {
            help,
            future: false
        }
    },

    getMood() {
        this.help
        this.burp()
        this.personality

        return this.grump() + "!";
    },

    hey() {
        this.burp()
        return {}
    }
})


type _SwampFrog = PrivateRole<typeof $SwampFrog>;

export function setHelp(swampFrog: _SwampFrog, value: string) {
    swampFrog.help = value; //main 
}

export function getHelp(swampFrog: _SwampFrog, value: string) {
    swampFrog.help = value; //main 
    swampFrog.grump()
    swampFrog.personality
}





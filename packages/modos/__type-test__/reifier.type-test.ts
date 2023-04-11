import { $type, Consolidate } from "../../types";
import { IReactive, reactive } from "../../paravue/reactivity";
import { ModelData } from "../Model";
import { Data, defineRole, Role, PrivateRole } from "../../etre/Role";
import { $BullFrog, $GrumpyFrog, $SwampFrog } from "./Role.type-test";


const FROG = Symbol();

export type Frog = Role<typeof $Frog>;
export type FrogData = ModelData<typeof createFrog>;
type _Frog = PrivateRole<typeof $Frog>;

export const $Frog = defineRole({
    interface: $type as IReactive,
    marker: { [FROG]: true },
    prereqs: {
        $SwampFrog
    },

    $construct(data: Data<{ width: number }>) {
        return { ...data, bug: true }
    },

    setWidth(width: number) {
        this.width = width
    }
})

const some = null as unknown as Frog
some.burp



function composeFn(data: Data<{
    width: number;
} & {
    help: string;
}>) {
    const { methods: { setWidth }, props: { bug, width } } = $Frog.confer(data);
    const { methods: { grump } } = $GrumpyFrog.confer();
    const { methods: { burp }, props: { personality } } = $BullFrog.confer();
    const { methods: { getMood, hey }, props: { future, help } } = $SwampFrog.confer(data);
    return reactive({
        bug,
        burp,
        future,
        getMood,
        grump,
        help,
        hey,
        personality,
        setWidth,
        smurfs: (something: string) => { return {} },
        width,
    })
}

const areac = reactive({
    but: "sfjkdjf"
})

const createFrog = $Frog.reifier((data) => {
    const frog = $Frog.confer(data);
    const grumpyFrog = $GrumpyFrog.confer();
    const bullFrog = $BullFrog.confer();
    const swampFrog = $SwampFrog.confer(data);

    return reactive({
        ...frog.methods,
        ...frog.props,
        ...grumpyFrog.methods,
        ...bullFrog.methods,
        ...bullFrog.props,
        ...swampFrog.methods,
        ...swampFrog.props,
        // ...$Frog.implement($BullFrog, { smurfs: false }),
        smurfs: (something: string) => { return {} },
        // parcour: "fdf"
    });

}, (!__DEV__) || {
    __prereqs__: {
        $BullFrog,
        $GrumpyFrog,
        $SwampFrog
    }
})
// "burp" | "personality" | "grump" | "hey" | "help" | "getMood" | "future" | "setWidth" | "bug" | "width" | "smurfs"
// "burp" | "personality" | "grump" | "hey" | "help" | "getMood" | "future" | "setWidth" | "bug" | "width"

const frog = createFrog({ width: 10, help: "please" })
frog.getMood()
frog.personality
frog.smurfs



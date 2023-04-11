//@-ts-nocheck
import { Cast } from '../../types';
import { $type, Consolidate } from "../../types";
import { IReactive, reactive } from "../../paravue/reactivity";
import { $clone, $id, enrollModelMaker, ModelData } from "../Model";
import { Data, Role, defineRole, $val, $Role, _INTERFACE_, _IMPLEMENTS_ } from "../../etre/Role";
import { $BullFrog, $GrumpyFrog, $SwampFrog, BULLY, SWAMP_FROG } from "./Role.type-test";
import { flatPea, flatPeapod, PeaType } from "../revival/flatdata";
import { implement } from "../../etre/reifier"
import { EqualTypes, typeTest } from '../../dev/type-test';
import { beforeDisposedOf, onCreated, onDisposedOf, onMade } from '../lifecycle-hooks';
import { InjectionKey } from 'vue';
// export type ListItem = Role<typeof $ListItem>
// export type ListItemData = ModelData<typeof $ListItem>;
// type _ListItem = PrivateRole<typeof $ListItem>;

// export const createListItem = enrollModelDef({
//     name: "ListItem",
//     revive: [
//         flatPea("pod", $PodNode),
//         flatPea("pea", $PeaNode),
//     ],
//     make: reifier($ListItem, (data) => {
//         const { isDetached } = $PeaNode.confer();

//         return reactive({
//             id: "",
//             pod: null,
//             isDetached
//         });

//     }, (!__DEV__) || {
//         __prereqs__: {
//             $PeaNode
//         }
//     })
// });


// export const createListItem = enrollModelDef({
//     name: "ListItem",
//     make: class ListItem {
//         constructor(data: string) {

//         }
//     }
// });





const FROG = Symbol();

type _FrogData = { width: number }

export type Frog = Role<typeof $Frog>;
export type FrogData = ModelData<typeof createFrog>;

export const $Frog = defineRole({
    interface: $type as IReactive,
    marker: { [FROG]: true },
    prereqs: {
        $SwampFrog
    },

    $construct(data: Data<_FrogData>) {
        const { width } = data;
        onCreated((model) => {

        })
        onMade((model) => {

        });
        beforeDisposedOf(() => {

        })
        onDisposedOf(() => {

        })
        // onWidthSet((model) => {

        // })
        return {
            width,
            isFrog: true,
        }
    },

    setWidth(width: number) {
        this.width = width
        this.help
    },

})

type FrogType = Consolidate<{
    width: number;
    isFrog: boolean;
    setWidth: (width: number) => void;
    help: string;
    future: boolean;
    hey: () => {};
    getMood: () => string;
    grump: () => "humph";
    personality: string;
    burp: () => boolean;
    [BULLY]: boolean;
    smurfs: (...args: any) => {};
    [SWAMP_FROG]: boolean;
    [FROG]: boolean;
} & IReactive>

type FrogTypeDef = Consolidate<typeof $Frog["__typeDef__"]>;
if (__DEV__) typeTest<EqualTypes<FrogTypeDef, FrogType>>(true)

type FrogImplements = typeof $Frog[typeof _IMPLEMENTS_];
if (__DEV__) typeTest<EqualTypes<FrogImplements, {}>>(true)


type FrogInterface = typeof $Frog[typeof _INTERFACE_];
if (__DEV__) typeTest<EqualTypes<FrogInterface, IReactive>>(true)


type SwampFrogImplements = typeof $SwampFrog[typeof _IMPLEMENTS_];
if (__DEV__) typeTest<EqualTypes<SwampFrogImplements, { hey: () => {} }>>(true)


type SwampFrogInterface = typeof $SwampFrog[typeof _INTERFACE_];
if (__DEV__) typeTest<EqualTypes<SwampFrogInterface, IReactive & { smurfs: (...args: any[]) => {} }>>(true)


export const [createFrog, FROG$] =
    enrollModelMaker({
        name: "Frog",
        make: $Frog.reifier((data) => {
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
                smurfs: implement($SwampFrog, "smurfs", () => { return {} }),
            });

        }, (!__DEV__) || {
            __prereqs__: {
                $BullFrog,
                $GrumpyFrog,
                $SwampFrog,
            }
        })
    })



const frog = createFrog({ help: "oof", width: 10 })
frog.burp()
frog.getMood()
frog.personality
frog.help
frog.smurfs



//Test ModelData type
// CASE: with class

export type FroggyData = ModelData<typeof Froggy>;

class Froggy {
    width: number;

    constructor(data: Data<{ width: number }>) {
        this.width = data.width
    }

    setWidth(width: number) {
        this.width = width
    }
}


// //Test ModelData type
type FooData_ = ModelData<typeof createFoo>

const some = $type as FooData_;
some.contents //string[]
some.one.two //string[]
some.tripleOne.tripleTwo.tripleThree //string

const $Foo = defineRole({
    $construct(data: Data<{
        frog: "sir robin",
        contents: { id: string }[],
        one: {
            two: {
                id: string
            }[],
            other: {
                bongo: true
            }
        },
        tripleOne: {
            tripleTwo: {
                tripleThree: {
                    id: string
                },
                mother: {}
            },
            oanlk: {
                ball: 9
            }
        }
    }>) {
        return {
            ...data
        }
    }
})

const [createFoo, FOO$] =
    enrollModelMaker({
        name: "Foo",
        revive: [
            flatPeapod("contents", [], PeaType.VINE),
            flatPea("one.two", [], PeaType.VINE),
            flatPea("tripleOne.tripleTwo.tripleThree", [], PeaType.UNRELIANT),
        ],
        make: $Foo.reifier((data) => {
            const foo = $Foo.confer(data);
            return {
                // id: $id,
                ...foo.props,
            }
        })
    })

const foo = createFoo({ contents: [], frog: "sir robin", one: { two: [], other: { bongo: true } }, tripleOne: { oanlk: { ball: 9 }, tripleTwo: { mother: {}, tripleThree: { id: "" } } } });

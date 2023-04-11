import { MiscObj } from "@rue/utils";


function defineEventFlow(name: string, { }) {

}


// handler map

// defineEventFlow("mouseFlow", {  //This is an event flow system
//     mousedown: useMouseFlowBeginner,
//     mousemove: useMouseFlowContinuer,
//     mouseup: useMouseFlowContinuer, //mouse up needs to check if it's not a click and end flow if it's not a click
//     click: useMouseFlowEnder
// })

// registerActionFlow({ //This is a control flow system + event flow system. It can also simply be a control flow system
//     name: "deleteTextAcross",


// })

type ControlFlowConfig = {
    name: string,
    conditions: { [key: string]: any }[],
    re: { [key: string]: () => void }
}

// runtime solution
export function useControlFlow() {
    let flows = [] as ControlFlowConfig[];
    return {
        registerControlFlow(config: ControlFlowConfig) {
            flows.push(config)
        },
        compileControlFlowMap() {
            const controlFlowMap = {

            } as MiscObj

            for (const flow of flows) {

            }

            return {
                getHandler(event: string, key: string) {
                    return controlFlowMap[event].get(key);
                }
            }
        }
    }
}


// precompile to js (after ts compiles to js)
// const controlFlowMap = {
//     // complex object
//     jklkj: () => { },
//     getHandler(key) {
//         return this[key];
//     }
// }



// registerControlFlow({
//     name: "deleteTextAcross",
//     conditions: [{
//         caretType: "",
//         inputType: ""
//     }, {
//         deletionType: ""
//     }],
//     re: {
//         beforeInput: () => {

//         },
//         input: () => {

//         }
//     }
// })
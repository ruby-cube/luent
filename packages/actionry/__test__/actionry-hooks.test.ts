import { describe, expect, test } from "vitest";
import { doAction, onActionCallbackDone, onActionCompleted, onActionStart } from "../actionry";
import { reactive } from "vue";
import { watch } from "vue";
import { nextTick } from "vue";

describe("doAction's hooks, reactive effects run in proper order", () => {

    test("CASE: return void, action name", () => {
        const order: (number | string)[] = [];

        const item = reactive({
            content: "hi"
        })

        watch(() => item.content, () => {
            console.log("effect")
            order.push(4)
        })

        initAction();

        doAction("returnVoid", () => {
            order.push(2)
            item.content = "bye";
            nextTick(() => {
                order.push("tick")
            })
        })

        function initAction(){
            onActionStart((action) => {
                order.push(1)
    
                onActionCallbackDone(action, () => {
                    order.push(3)
                })
    
                onActionCompleted(action, () => {
                    order.push(5)
                    expect(order).toEqual([1, 2, 3, 4, "tick", 5])
                })
            })
        }
    })

})
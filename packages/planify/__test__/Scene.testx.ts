import { vi, expect, describe, test, beforeEach } from "vitest";
import { nextTick } from "vue";
import { defineRole, PrivateRole, Role } from "../../etre/Role";
import {  __$initDepotModule, isMakingModel, destroyModel, $onDestroyed } from "../../modos/depot";
import { onDestroyed } from "../../modos/lifecycle-hooks";
import { enrollModelMaker } from "../../modos/Model";
import { $Modo } from "../../modos/Modo.role";
import { createHook } from "../../pecherie/Hook";
import { defineAutoCleanup } from "../scheduleAutoCleanup";
import { beginScene, UNATTACHED } from "../Scene";
import { $type } from "@rue/utils";

describe("Autocleanup of scenes", () => {
    beforeEach(() => {
        __$initDepotModule();
        defineAutoCleanup((cleanup) => {
            if (isMakingModel()) {
                console.log("scheduling auto cleanup")
                return onDestroyed(cleanup);
            }
        })
    })

    function setupModel(unattached?: boolean) {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castTestEnded, onTestEnded] = createHook({
            hook: "test-ended",
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })

        const $ListItem = defineRole({
            prereqs: {
                $Modo
            },
            $construct() {
                beginScene((scene) => {
                    onTestCase(cb);
                    onTestEnded(() => {
                        scene.end()
                    })
                }, unattached)
            }
        });

        const [createListItem] =
            enrollModelMaker({
                name: "ListItem",
                make: $ListItem.reifier((data) => {
                    $ListItem.confer();
                    return {
                        id: "listItem000",
                    };
                }, {
                    __prereqs__: {
                        $Modo
                    }
                })
            });


        const listItem = createListItem({ id: "lkjlkj" });

        return {
            cb,
            castTestCase,
            listItem,
            castTestEnded
        }
    }

    test("CASE: inside $construct, attached, scene ends BEFORE model destroyed", () => {

        const { castTestCase, cb, listItem, castTestEnded } = setupModel()
        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(2);

        castTestEnded();

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(2);

        destroyModel(listItem);
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(2);
    });

    test("CASE: inside $construct, attached, scene ends AFTER model destroyed", () => {

        const { castTestCase, cb, listItem, castTestEnded } = setupModel()
        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(2);

        destroyModel(listItem);
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(2);

        //@ts-expect-error
        const targetMap = $onDestroyed.targetMap;
        expect(targetMap.get(listItem).size).toBe(0); // $onDestroyed cleaned up

        castTestEnded();

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(2);
    });

    test("CASE: inside $construct, unattached, scene ends AFTER model destroyed", () => {

        const { castTestCase, cb, listItem, castTestEnded } = setupModel(UNATTACHED)
        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(2);

        //@ts-expect-error
        const targetMap = $onDestroyed.targetMap;
        expect(targetMap.get(listItem).size).toBe(2) // because unattached, no auto cleanup should be scheduled, but callbacks for heed(REINSTATE) and $onDestroyed should be there, hence "2"

        destroyModel(listItem);
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(4);

        castTestEnded();

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(4);
    });

    test("CASE: inside $construct, unattached, scene ends BEFORE model destroyed", () => {

        const { castTestCase, cb, listItem, castTestEnded } = setupModel(UNATTACHED)

        //@ts-expect-error
        const targetMap = $onDestroyed.targetMap;
        expect(targetMap.get(listItem).size).toBe(2)  // because unattached, no auto cleanup should be scheduled, but callbacks for heed(REINSTATE) and $onDestroyed should be there, hence "2"

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(2);

        castTestEnded();

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(2);

        destroyModel(listItem);
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(2);

    });

    test("CASE: inside $construct, use outer scene variable (instead of parameter), unattached", () => {

        const { castTestCase, cb, listItem, castTestEnded } = setupModelB(UNATTACHED)

        //@ts-expect-error
        const targetMap = $onDestroyed.targetMap;
        expect(targetMap.get(listItem).size).toBe(2)  // because unattached, no auto cleanup should be scheduled, but callbacks for heed(REINSTATE) and $onDestroyed should be there, hence "2"

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(2);

        castTestEnded();

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(2);
    });

})


function setupModelB(unattached?: boolean) {
    const [castTestCase, onTestCase] = createHook({
        hook: "test-hook",
        data: $type as {
            foo: "A"
        },
    });
    const [castTestEnded, onTestEnded] = createHook({
        hook: "test-ended",
        onceAsDefault: true
    });
    const cb = vi.fn(() => { })

    const $ListItem = defineRole({
        prereqs: {
            $Modo
        },
        $construct() {
            const scene = beginScene(() => {
                onTestCase(cb);
                onTestEnded(() => {
                    scene.end()
                })
            }, unattached)
        }
    });

    const [createListItem] =
        enrollModelMaker({
            name: "ListItem",
            make: $ListItem.reifier((data) => {
                $ListItem.confer();
                return {
                    id: "listItem000",
                };
            }, {
                __prereqs__: {
                    $Modo
                }
            })
        });

    const listItem = createListItem({ id: "lkjlkj" });
    return {
        cb,
        castTestCase,
        listItem,
        castTestEnded
    }
}
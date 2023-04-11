
describe("Autocleanup in modo system", () => {

    test("CASE: inside $construct", () => {
        __$initDepotModule();
        defineAutoCleanup((cleanup) => {
            if (isMakingModel()) {
                return onDestroyed(cleanup);
            }
        })
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const cb = vi.fn(() => { })

        const $ListItem = defineRole({
            prereqs: {
                $Modo
            },
            $construct() {
                onTestCase(cb)
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

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1)

        destroyModel(listItem);
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1)

    });
})
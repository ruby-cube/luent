import { Data, defineRole } from "@rue/etre";
import { __$initDepotModule, populateDepot } from "../depot";
import { expect, describe, test } from "vitest";
import { enrollModelMaker } from "../Model";

describe("enrollModelMaker", () => {

    test("CASE: Reify a single role, enroll as modo, no vine, create", () => {
        __$initDepotModule();
        const $Frog = defineRole({
            $construct(data: Data<{ name: string }>) {
                return {
                    name: data.name,
                    location: "swamp"
                }
            },
            croak() { }
        })

        const { methods: { croak } } = $Frog.confer({ name: "" } as Data<{ name: string }>)
        const depot = populateDepot.__getDepot();

        const [createFrog, FROG$] = enrollModelMaker({
            name: "Frog",
            make: $Frog.reifier((data) => {
                const frog = $Frog.confer(data);
                return {
                    ...frog.methods,
                    ...frog.props
                };
            })
        })
        const frog = createFrog({ name: "sir robin" });

        const xFrog = { id: frog.id, croak, name: "sir robin", location: "swamp" };
        const expectedDepot = new Map([
            [frog.id, xFrog],
        ]);

        expect(depot).toEqual(expectedDepot);
        expect(frog).toEqual(xFrog);
    });

});
import { describe, test, expect, vi, beforeEach } from "vitest";
import { Data, role } from "../Role";
import { __resetGlobals } from "../../dev/__resetGlobals";

describe("reifer", () => {
    beforeEach(__resetGlobals)
    test("CASE: Reify a single role", () => {

        const $Frog = role({
            $construct(data: Data<{ name: string }>) {
                return {
                    name: data.name,
                    location: "swamp"
                }
            },
            croak() { }
        })

        const { methods: { croak } } = $Frog.confer({ name: "" } as Data<{ name: string }>)

        const createFrog = $Frog.reifier((data) => {
            const frog = $Frog.confer(data);
            return {
                ...frog.methods,
                ...frog.props
            }
        });

        const frog = createFrog({ name: "sir robin" });
        expect(frog).toEqual({ croak, name: "sir robin", location: "swamp" })

    });

    test("CASE: Reify a single role with auto compose", () => {

        const $Frog = role({
            $construct(data: Data<{ name: string }>) {
                return {
                    name: data.name,
                    location: "swamp"
                }
            },
            croak() { }
        })

        const { methods: { croak } } = $Frog.confer({ name: "" } as Data<{ name: string }>)

        const createFrog = $Frog.reifier();

        const frog = createFrog({ name: "sir robin" });
        expect(frog).toEqual({ croak, name: "sir robin", location: "swamp" })

    });

});




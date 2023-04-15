import { describe, test, expect, vi } from "vitest";
import { Data, role } from "../Role";

describe("reifer", () => {

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




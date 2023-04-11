

// USAGE:

import { createHook } from "../../pecherie/Hook";
import { FROG$ } from "../__test__/Model.type-test";
import { enrollPersistedProps, initPersistence } from "./persistence";


// register persistible

// these must be run before depot populates! ... which will delay rendering ... can this be put off till after initial paint?
enrollPersistedProps(FROG$, ["getMood.kjkjd", "grump", ["dfdf", "Sdfsdf"]])





const [castAppMounted, onAppMounted] = createHook({
    hook: "app-mounted",
    onceAsDefault: true,
})

initPersistence((changes) => {
    // for (const change of changes) {
    //     localDB.patch(); //TODO: I don't know enough about dbs to know how to design a good API for this
    //     db.patch() //TODO: I don't know enough about dbs to know how to design a good API for this
    // }
}, onAppMounted);

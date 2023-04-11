import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import { App, nextTick, onBeforeUnmount, watch } from "vue";
import { $type } from "../../types";
import { onUnmounted, reactive } from "../../paravue/reactivity";
import { getModel, __$initDepotModule, isMakingModel, populateDepot } from "../depot";
import { flatPeapod, PeaType } from "../revival/flatdata";
import { $id, enrollModelMaker } from "../Model";
import { $Modo } from "../Modo.role";
import { Data, defineRole, Role, PrivateRole } from "../../etre/Role";
import { $PeaNode } from "../vine/PeaNode.role";
import { $PeapodPea } from "../vine/PeapodPea.role";
import { $PodNode } from "../vine/PodNode.role";
import { defineAutoCleanup } from "../../planify/scheduleAutoCleanup";
import { onDestroyed } from "../lifecycle-hooks";
import { isSettingUpComponent } from "../../paravue/component";
import { doAction, onActionCompleted, onActionStart } from "../../actionry/actionry";
import { beginScene, defineScene } from "../../planify/Scene";


const initalDatasets = [{
  name: "ListItem", entries: [{
    id: "listItem01"
  },
  {
    id: "listItem02"
  },
  {
    id: "listItem03"
  },
  {
    id: "listItem04"
  }]
},
{
  name: "List", entries: [{
    id: "list01",
    contents: ["listItem01", "listItem02"]
  },
  {
    id: "list02",
    contents: ["listItem03", "listItem04"]
  }]
},
{
  name: "Doc", entries: [{
    id: "doc01",
    contents: ["list01", "list02"]
  }]
}]

describe("vine system", () => {
  beforeEach(() => {
    __$initDepotModule();
    defineAutoCleanup((cleanup) => {
      if (isSettingUpComponent()) {
        return onUnmounted(cleanup);
      }
      if (isMakingModel()) {
        return onDestroyed(cleanup);
      }
    })
  })
  test("CASE: Populates depot", () => {
    setupPopulateDepotTest();
  });

  test("CASE: Populates depot and disposes detached peas", () => {
    runPeaDisposalTest();
  });

  test("CASE: Populates depot, disposes detached peas, and reinstates peas", () => { 
    return runReinstatePeasTest();
  });
});



function setupVineModels() {

  type ListItem = Role<typeof $ListItem>;
  type _ListItem = PrivateRole<typeof $ListItem>;

  const $ListItem = defineRole({
    prereqs: {
      $PeapodPea
    }
  });

  const createListItem = enrollModelMaker({
    name: "ListItem",
    make: $ListItem.reifier((data) => {
      const peaNode = $PeaNode.confer();

      return reactive({
        id: $id,
        index: null,
        pod: null,
        ...peaNode.methods
      });

    }, {
      __prereqs__: {
        $Modo,
        $PeaNode,
        $PeapodPea
      }
    })
  });

  type List = Role<typeof $List>
  type _List = PrivateRole<typeof $List>

  const $List = defineRole({
    prereqs: {
      $PodNode,
      $PeapodPea
    },
    $construct(data: Data<{ contents: ListItem[] }>) {
      return {
        contents: data.contents
      }
    }
  })

  enrollModelMaker({
    name: "List",
    make: $List.reifier((data) => {
      const list = $List.confer(data);
      const peaNode = $PeaNode.confer();

      return reactive({
        id: $id,
        ...list.props,
        index: null,
        pod: null,
        ...peaNode.methods,
      })
    }, {
      __prereqs__: {
        $Modo,
        $PeaNode,
        $PeapodPea,
        $PodNode
      }
    }),
    revive: [
      flatPeapod("contents", [$ListItem], PeaType.VINE)
    ]
  })

  const $Doc = defineRole({
    prereqs: {
      $PodNode
    },
    $construct(data: Data<{ contents: List[] }>) {
      return {
        contents: data.contents
      }
    }
  })

  enrollModelMaker({
    name: "Doc",
    make: $Doc.reifier((data) => {
      const doc = $Doc.confer(data);

      return reactive({
        id: $id,
        ...doc.props
      })
    }, {
      __prereqs__: {
        $Modo,
        $PodNode
      }
    }),
    revive: [
      flatPeapod("contents", [$List], PeaType.VINE)
    ]
  })

  return { $Doc, $List };
}


function setupPopulateDepotTest() {

  const depot = populateDepot.__getDepot();
  const vineModelDefs = setupVineModels();
  populateDepot(initalDatasets);


  const peaNode = $PeaNode.confer();
  const peaMethods = peaNode.methods;
  // const podMethods = getSpreadableMethods(podNode)

  const xListItem01 = reactive({ id: "listItem01", index: 0, pod: $type as any, ...peaMethods });
  const xListItem02 = reactive({ id: "listItem02", index: 1, pod: $type as any, ...peaMethods });
  const xListItem03 = reactive({ id: "listItem03", index: 0, pod: $type as any, ...peaMethods });
  const xListItem04 = reactive({ id: "listItem04", index: 1, pod: $type as any, ...peaMethods });
  const xList01 = reactive({ id: "list01", contents: [xListItem01, xListItem02], index: 0, pod: $type as any, ...peaMethods });
  const xList02 = reactive({ id: "list02", contents: [xListItem03, xListItem04], index: 1, pod: $type as any, ...peaMethods });
  const xDoc01 = reactive({ id: "doc01", contents: [xList01, xList02] });
  xListItem01.pod = xList01;
  xListItem02.pod = xList01;
  xListItem03.pod = xList02;
  xListItem04.pod = xList02;
  xList01.pod = xDoc01;
  xList02.pod = xDoc01;

  //@ts-expect-error
  const expectedDepot = new Map([
    ["doc01", xDoc01],
    ["list01", xList01],
    ["list02", xList02],
    ["listItem01", xListItem01],
    ["listItem02", xListItem02],
    ["listItem03", xListItem03],
    ["listItem04", xListItem04],
  ]);

  // console.log("depot", depot)
  // console.log("expectedDepot", expectedDepot)
  expect(depot).toEqual(expectedDepot);

  return { ...vineModelDefs, xDoc01, xList01, xList02, xListItem01, xListItem02, xListItem03, xListItem04 };
}

function runPeaDisposalTest() {
  return new Promise(async (done: (value: ReturnType<typeof setupPopulateDepotTest>) => void) => {

    const state = setupPopulateDepotTest();
    const depot = populateDepot.__getDepot();
    const trash = populateDepot.__getTrash();
    const { $Doc, $List, xDoc01, xList01, xList02, xListItem01, xListItem02, xListItem03, xListItem04 } = state;

    const doc = getModel("doc01") as PrivateRole<typeof $Doc>;
    const list01 = getModel("list01") as PrivateRole<typeof $List>;

    _initAction();

    doAction("deleteList02", () => {
      doc.contents = [list01];
    })

    queueMicrotask(() => {
      console.log("running microtask")
      nextTick(() => {
        console.log("tick")
      })
    })


    function _initAction() {
      onActionStart((action) => {
        beginScene((scene) => {

          onActionCompleted(action, () => {
            console.log("action completed", action)
            xDoc01.contents = [xList01];
            xList02.pod = null;
            //@ts-expect-error
            xList02.index = null;
            const expectedTrash = new Map([
              ["list02", xList02],
              ["listItem03", xListItem03],
              ["listItem04", xListItem04],
            ]);

            //@ts-expect-error
            const expectedDepot = new Map([
              ["doc01", xDoc01],
              ["list01", xList01],
              ["listItem01", xListItem01],
              ["listItem02", xListItem02],
            ]);

            console.log("trash", trash)
            console.log("expectedTrash", expectedTrash)
            expect(trash).toEqual(expectedTrash);
            expect(depot).toEqual(expectedDepot);
            scene.end();
            done(state);
          })
        })
      }, { once: true })
    }

  })
}

async function runReinstatePeasTest() {
  return new Promise(async (done) => {
    const state = await runPeaDisposalTest();
    console.log("passed dispose")
    const depot = populateDepot.__getDepot();
    const trash = populateDepot.__getTrash();
    const { xDoc01, xList01, xList02, xListItem01, xListItem02, xListItem03, xListItem04, $Doc, $List } = state;

    const doc = getModel("doc01") as PrivateRole<typeof $Doc>;
    const list01 = getModel("list01") as PrivateRole<typeof $List>;
    const list02 = getModel("list02") as PrivateRole<typeof $List>;
    initAction();
    doAction("reattachList02", () => {
      doc.contents = [list01, list02];
    })
    // done("")

    function initAction() {
      onActionStart((action) => {
        beginScene((scene) => {
          onActionCompleted(action, () => {
            console.log("REINSTATE action completed")
            xDoc01.contents = [xList01, xList02];
            xList02.index = 1;
            xList02.pod = xDoc01;
            const expectedTrash = new Map();
            //@ts-expect-error
            const expectedDepot = new Map([
              ["listItem01", xListItem01],
              ["listItem02", xListItem02],
              ["list01", xList01],
              ["doc01", xDoc01],
              ["list02", xList02],
              ["listItem03", xListItem03],
              ["listItem04", xListItem04],
            ]);
            console.log("trash", trash)
            console.log("expectedTrash", expectedTrash)

            // expect(trash).toEqual(expectedTrash);
            // expect(depot).toEqual(expectedDepot);

            scene.end();
            done("")
          })
        })

      }, { once: true })
    }
  })
}
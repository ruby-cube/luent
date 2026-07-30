import { Flask, getActiveFlask } from "./Flask";


export function atEnd(task: () => void) {
   getActiveFlask()?.onDiscard(task)
}

class ThisScene {
   constructor(private flask: Flask) { }
   end() {
      this.flask.emitDiscard()
   }
}

export function Scene(sceneSetup: (scene: ThisScene) => void, options?: { detached: boolean }): ThisScene {
   const detached = options?.detached
   const flaskConfig = { type: 'scene', creationScope: true }
   const enclosingFlask = getActiveFlask()
   const flask = detached ? new Flask(flaskConfig) : enclosingFlask?.spawn(flaskConfig) || new Flask(flaskConfig)
   const scene = new ThisScene(flask)
   sceneSetup(scene);
   return scene
}





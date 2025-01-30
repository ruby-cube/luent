import { ListenerOptions, Flask, getActiveFlask, ThisFlask } from "@rue/flask";



export function $thisScene() {
   const flask = getActiveFlask();
   if (!flask) throw new Error('No flask found. Must call within the scope of a flask')
   if (flask.type !== 'scene') throw new Error('$thisScene() may only be called directly within a scene scope--e.g. the callbacks of listen() and watch()')
   return flask.thisFlask || new ThisScene(flask);
}


class ThisScene extends ThisFlask {
   end() {
      this.flask.emitDiscard()
   }
}









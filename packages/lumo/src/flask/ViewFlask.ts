import { Flask, getActiveFlask, ThisFlask } from "@rue/flask";

export function getActiveViewFlask() {
   return findViewFlask(getActiveFlask());
}

export function getViewFlask(): Flask {
   const flask = getActiveViewFlask()
   if (!flask) throw Error('no dynamic node found')
   return flask;
}

function findViewFlask(flask: Flask | undefined) {
   // TODO: RESEARCH/EXPERIENCE REQUIRED: 
   // Questionable whether this should be allowed. Maybe it's better practice to only call $thisView() directly in the view and pass down?
   // and then we wouldn't need a public .outer property
   do {
      if (flask?.type === 'view') return flask;
      flask = flask?.outer
   }
   while (flask)
   throw new Error('no view flask found')
}

export function $thisView() {
   const flask = getViewFlask();
   if (!flask) throw new Error('No flask found. Must call within the scope of a flask')
   return flask.thisFlask || new ThisFlask(flask);
}










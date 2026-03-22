import { hasQuark, QUARK, quarkOf } from "../abstract/Quark";
import { Traceable, TraceableEntity, TraceableMutable } from "./Traceable";
import { Ion, MutableIon } from "../ion/Ion";
import { __DEV__getTrace, getAsyncPath, traceAsyncPath } from "../../../flask/debug";
import { Compound, Particle } from "../reactivity/Compound";
import { watch } from "../reactivity/Watcher";
import { isFunction, isObject } from "@rue/utils";
import { DerivationIonQuark } from "../ion/DerivationIon";
import { Stateful } from "../abstract/Stateful";
import { PRELUDE } from "../reactivity/RenderCycle";

function isTraceableCompound(quark: Object): quark is TraceableCompound {
   if (!('asTraceable' in quark)) {
      return false;
   }
   if (!('particles' in quark)) {
      return false;
   }
   return true;
}

function toTraceableDerivation(fn: Function): { [QUARK]: DerivationIonQuark } {
   return Ion(fn, {
      devName: fn.name ?? fn // TODO: origin should be unknown
   }) as any as { [QUARK]: DerivationIonQuark }
}

export const dev = {
   /**
    * Schedules logging the atoms of the target for the prelude phase of render cycle
    */
   logAtoms(target: unknown, options?: { onChange: boolean }) {
      if (!hasQuark(target) && !isFunction(target)) {
         console.log('No atoms to log')
         return;
      }
      const quark = hasQuark(target) ? quarkOf(target) : quarkOf(toTraceableDerivation(target))
      if (!isTraceableCompound(quark)) return;
      watch(target, () => logAtoms(quark), {
         phase: PRELUDE,
         eager: true
      })
   },
   /**
    * Schedules logging the compounds of the target for the prelude phase of render cycle
    */
   logCompounds(target: unknown) {
      throw new Error('logCompounds not yet implemented')
   },

   /**
    * - Turns on mutation tracing of an mutable ion or ionic model
    * - traces triggers of derivations
    */
   traceMutations(target: unknown) {
      const quark = hasQuark(target) ? quarkOf(target) : isFunction(target) ? quarkOf(target = toTraceableDerivation(target)) : undefined
      if (!quark) {
         console.warn('Cannot trace mutation of', target, '--not traceable')
         return;
      }
      if (!('asTraceable' in quark)) {
         console.warn('Cannot trace mutation of', target, '--not traceable')
         return;
      }
      const traceable = quark.asTraceable as Traceable
      if ('traceMutation' in traceable) {
         traceable.traceMutation = true;
         // TODO: Hybrid ions
      }
      else if (isFunction(target)) {
         traceTriggers(target)
      }
   }
}

// TODO: style better
export function traceMutation(traceable: TraceableMutable | undefined, previous: any, next: any) {
   if (!__DEV__) return;
   if (!traceable) return;
   if (traceable.traceMutation) {
      console.log('')
      console.group(`%cMutation of ${traceable.name}`, 'font-weight: bold; background-color: lightblue; color: black; padding-inline: .5em')
      console.log(traceable.origin)
      console.log(`${previous} ⟹ ${next}`)
      traceAsyncPath()
      console.groupEnd()
      console.log('')
   }
   if (traceable.logTrigger) {
      const trace = __DEV__getTrace()
      const path = getAsyncPath?.()?.slice(3).trimEnd()
      traceable.logTrigger = () => {
         console.log('')
         console.group(`%cMutation of ${traceable.name}`, 'font-weight: bold; background-color: lightblue; color: black; padding-inline: .5em')
         console.log(traceable.origin)
         console.log(`${previous} ⟹ ${next}`)
         console.log('%casync trace:', 'font-weight: bold')
         console.log(`%c    ` + (trace ? trace + '\n    ' : '') + '%cat async%c ' + path, 'padding-block: .25em', 'font-weight: bold', 'font-weight: regular; padding-block: .25em')
         console.groupEnd()
         console.log('')
         traceable.logTrigger = true
      }
   }
}



/**
 * Traces triggers of derivations and effects
 */
function traceTriggers(target: Function) {
   const quark = hasQuark(target) ? quarkOf(target) : undefined
   if (!quark || !isTraceableCompound(quark)) {
      console.warn('Cannot trace', target)
      return;
   }
   if (quark.particles.length === 0) target() // induces tracking
   markTriggers(quark.particles)

   watch(target, () => {
      logTriggers(quark)
   }, {
      phase: PRELUDE
   })
}



function _logAtoms(particles: Particle[]) {
   for (const particle of particles) {
      const traceable = particle.asTraceable!
      if ('particles' in particle) {
         console.group(`${traceable?.name}:`, particle.getState())
         console.log(traceable?.origin)
         _logAtoms(particle.particles)
         console.groupEnd()
      }
      else {
         console.group(`${traceable?.name}:`, particle.getState())
         console.log(traceable?.origin)
         console.groupEnd()
      }
   }
}
// debugging from declaration

// debugging as child

// debugging as parent



//  - [ ] logAtoms of compounds (runtime)
//  - [ ] traceTriggers of compounds (runtime) + traceMutation

//  - [ ] logCompounds of atom (runtime graph)
//  - [ ] traceMutation of atom/model (runtime)

// - seeing before and after state

// const $count = Ion(0, { __devName: '$count' })

// // --

// const $doubleCount = Ion(() => $count() * 2)

// const $doubleCountLessOne = Ion(() => $doubleCount() - 1)

// dev.logAtoms($doubleCountLessOne) // queue to prelude of render cycle to batch

// dev.traceMutation($count) // adds a set 

// dev.log()






// console.group('Atoms of `$quadruple`');
// console.log('file://$quadruple.ts')
// console.log('value: 4')
// console.group('$doubleCount');
// console.log('file://doubleCount.ts')
// console.log('value: 2')
// console.group('$count');
// console.log('file://count.ts')
// console.log('value: 1')
// console.groupEnd();
// console.groupEnd();
// console.group('$another');
// console.log('file://doubleCount.ts')
// console.log('value: 2')
// console.group('$base');
// console.log('file://count.ts')
// console.log('value: 1')
// console.groupEnd();
// console.groupEnd();
// console.group('%clogged by', 'color: gray')
// console.log('%c•', 'color: gray', 'file://doubleCount.ts')
// console.groupEnd();
// console.groupEnd();



// console.log('');
// console.group("%cCompounds of `$count`", 'background-color: lightblue');
// console.log('file://count.ts')
// console.log('value: 1')
// console.group('derivations:')
// console.group('$doubleCount')
// console.log('file://doublecount.ts')
// console.log('value: 2')
// console.groupEnd();
// console.groupEnd();
// console.groupEnd();
// console.log('');

// console.log(' ')
// console.trace('%cTrigger of `doSomething`', 'font-weight: bold; background-color: lightgreen')

type TraceableCompound = TraceableEntity & Compound & (Stateful | {})

// TODO: what about watch( {phase: SYNC, once: true }) ?? atoms will not be logged
export function logAtoms(subject: TraceableCompound) {
   const traceable = subject.asTraceable as Traceable
   console.log('')
   console.groupCollapsed(`%cAtoms of \`${traceable?.name}\``, "background-color: lightblue; padding-inline: .5em; color: black")
   if ('getState' in subject) console.log('value:', subject.getState())
   _logAtoms(subject.particles)
   console.groupEnd()
   console.log('')
}

export function logTriggers(subject: TraceableCompound) {
   const traceable = subject.asTraceable as Traceable
   console.log('')
   console.groupCollapsed(`%cTriggers of \`${traceable.name}\``, "background-color: lightblue; padding-inline: .5em; color: black")
   if ('getState' in subject) console.log('value:', subject.getState())
   logTraces(subject.particles)
   console.groupEnd()
   console.log('')
}

function logTraces(particles: Particle[]) {
   for (const particle of particles) {
      if ('particles' in particle) {
         logTraces(particle.particles)
      }
      else if ('logTrigger' in particle.asTraceable! && isFunction(particle.asTraceable.logTrigger)) {
         particle.asTraceable.logTrigger()
      }
   }
}

function markTriggers(particles: Particle[]) {
   console.log('markTriggers', particles)
   for (const particle of particles) {
      if ('particles' in particle) {
         markTriggers(particle.particles)
      }
      else if ('logTrigger' in particle.asTraceable!) {
         particle.asTraceable.logTrigger = true
      }
   }
}


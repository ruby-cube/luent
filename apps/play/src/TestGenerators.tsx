import { Update } from "@rue/quarky";
import { queueTask } from "@rue/thread";

const BUFFER = 8.5

class CycleProcess {
   constructor(
      private update: Update
   ) {

   }

   private gen!: Generator
   private idle!: IdleDeadline

   get timeout() {
      if (typeof this.update.idle === 'number')
         return this.update.idle - (performance.now() - this.update.timestamp)
      return 0;
   }

   start(fn: (state: { paused: boolean, gen: Generator }) => Generator) {
      requestIdleCallback((deadline) => {
         this.idle = deadline;
         this.runOuter(fn, { paused: false, gen: undefined! })
      })
   }

   runOuter(fn: (state: { paused: boolean, gen: Generator }) => Generator, fnState: { paused: boolean, gen: Generator }) {
      fnState.gen = this.gen = fn(fnState)
      this.gen.next()
   }

   runNext(fn: (onComplete?: () => void) => Generator, onComplete?: () => void) {
      this.gen = fn(onComplete)
      this.gen.next()
   }

   mustPause() {
      return this.idle!.timeRemaining() < BUFFER
   }

   prepOuterPause(fnState: { paused: boolean, gen: Generator }) {
      fnState.paused = true;
      if (this.gen === fnState.gen)
         requestAnimationFrame(() => {
            fnState.paused = false;
            this.resume()
         })
   }

   resumeOuter(fnState: { paused: boolean, gen: Generator }) {
      this.gen = fnState.gen;
      if (fnState.paused)
         requestAnimationFrame(() => {
            fnState.paused = false;
            this.resume()
         })
   }

   prepPause() {
      requestAnimationFrame(() => { this.resume() })
   }

   resume() {
      requestIdleCallback((deadline) => {
         this.idle = deadline;
         this.gen.next()
      }, { timeout: this.timeout })
   }
}

// let gen: Generator;
// let idle: IdleDeadline;

// function resume(timeout: number) {
//    requestIdleCallback((deadline) => {
//       idle = deadline;
//       gen.next()
//    }, { timeout })
// }

// function mustPause() {
//    return idle!.timeRemaining() < BUFFER
// }

const cycle = new CycleCoordinator()


function* runTasks() {
   let i = 100;
   while (i--) {
      console.log('task', i)
      if (cycle.mustPause() && i > 1) {
         cycle.prepPause()
         yield;
      }
   }
   queueTask(done)

   function done() {
      document.body.style.backgroundColor = "pink";
      console.log('done')
   }
}

// const batches = {
//    paused: false,
//    gen: undefined as Generator | undefined
// }



function* runBatches(state: { paused: boolean, gen: Generator }) {
   let i = 100;
   while (i--) {
      console.log('batch', i)

      cycle.runNext(runEffects, () => {
         cycle.resumeOuter(state)
      })

      if (cycle.mustPause() && i > 1) {
         cycle.prepOuterPause(state)
         yield;
      }
   }
   cycle.runNext(runTasks)
}


function* runEffects(onComplete?: () => void) {
   let i = 100;
   while (i--) {
      console.log('effect', i)
      if (cycle.mustPause() && i > 1) {
         cycle.prepPause()
         yield;
      }
   }

   onComplete!()
}

export function startCycle() {
   cycle.start(runBatches)
   // requestIdleCallback((deadline) => {
   //    idle = deadline;
   //    batches.gen = gen = runBatches()
   //    gen.next()
   // })
}
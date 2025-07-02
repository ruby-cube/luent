// a queue that runs synchronously until the next animation frame where it will pause execution and continue after animation frame complete (onIdle)

function useLazyQueue() {
   let nextQueue: Task[] = []
   let queue: Task[] = []

   type Task = {
      (): void
      queued: boolean
   }

   function queueLazyTask(task: Task) {
      if (task.queued) return;
      if (runningTasks) {
         nextQueue.push(task)
      }
      else {
         queue.push(task)
      }
   }

   let runningTasks = false;
   let currentIndex = 0;

   function runLazyTasks() {
      runningTasks = true;
      for (let i = currentIndex; i < queue.length; i++) {
         if (timeLeft < 1) {
            currentIndex = i;
            requestIdleCallback(runLazyTasks)
            return;
         }
         else {
            const task = queue[i]
            task()
            task.queued = false;
         }
      }
      runningTasks = false;
      queue = nextQueue
      currentIndex = 0;
   }

   return {
      queueLazyTask,
      runLazyTasks
   }
}

class LazyEffectCyclePhase {

}

const interval = 1000 / 60; // ~16.67ms for 60Hz //TODO: what if user has a different frame rate
let frameTrackerActive = false;
let timeLeft = interval;

function startFrameTracker() {
   if (frameTrackerActive) return;
   frameTrackerActive = true;
   let lastFrame = performance.now();

   function trackTimeLeft(now: DOMHighResTimeStamp) {
      timeLeft = interval - (now - lastFrame);
      lastFrame = now;
      requestAnimationFrame(trackTimeLeft);
   }

   requestAnimationFrame(trackTimeLeft);
}


import { queueTask } from "@rue/thread";

export class InterruptibleQueue {
   tasks: (() => void)[] = []
   startTime: number = performance.now();
   startIndex = 0

   constructor() {
      const checkTime = () => {
         requestAnimationFrame(time => {
            this.startTime = time
            if (this.paused) {
               queueTask(() => this.runTasks())
            }
            checkTime()
         })
      }
      checkTime();
   }

   paused = false;

   runTasks() {
      const tasks = this.tasks;
      if (this.startIndex < tasks.length)
         for (let i = this.startIndex; i < tasks.length; i++) {
            tasks[i]()
            const elapsed = performance.now() - this.startTime
            const timeLeft = 16.7 - elapsed
            if (timeLeft < 9 && i + 1 < tasks.length) {
               this.startIndex = i + 1
               this.paused = true;
               break;
            }
            this.paused = false;
            this.startIndex = 0;
         }
   }

   addTask(task: () => void) {
      this.tasks.push(task)
   }
}
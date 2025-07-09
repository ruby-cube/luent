
type Task = (...args: any[]) => void

export class TaskRef {
   constructor(
      public fn: Task | null,
   ) { }

   discard() {
      this.fn = null;
   }
}


export class TaskQueue {
   nextQueue: TaskRef[] | undefined
   queue: TaskRef[] = []

   runningTasks: boolean = false;

   runTasks() {
      this.runningTasks = true;
      const tasks = this.queue


      const retained = new Set()

      for (const task of tasks) {
         if (task.fn) {
            try {
               task.fn()
            }
            finally {
               if (retained.has(task) || !task.fn) // fn may have been removed within call
                  continue;
               retained.add(task)
               const nextQueue = this.nextQueue ?? (this.nextQueue = [])
               nextQueue.push(task)
            }
         }
      }
      this.runningTasks = false;
      this.queue = this.nextQueue ?? []
      // this.queue = [...retainedTasks, ...(this.nestedTasks ?? [])]

      this.nextQueue = undefined;
   }

   scheduleTask(task: TaskRef) {
      if (this.runningTasks) {
         const nested = this.nextQueue ?? (this.nextQueue = [])
         nested.push(task)
      }
      else {
         this.queue.push(task)
      }
   }
}
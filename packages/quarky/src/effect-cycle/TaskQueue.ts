
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
   nestedTasks: TaskRef[] | undefined
   queue: TaskRef[] = []

   runningTasks: boolean = false;

   runTasks() {
      this.runningTasks = true;
      const tasks = this.queue
      

      const retained = new Set()
      const retainedTasks = []

      for (const task of tasks) {
         if (task.fn) {
            try {
               task.fn()
            }
            finally {
               if (retained.has(task) || !task.fn) // fn may have been removed within call
                  continue;
               retained.add(task)
               retainedTasks.push(task)
            }
         }
      }
      this.runningTasks = false;
      this.queue = this.nestedTasks ? retained.size ?
         [...retainedTasks, ...this.nestedTasks]
         : this.nestedTasks : retained.size ? retainedTasks : []
      // this.queue = [...retainedTasks, ...(this.nestedTasks ?? [])]

      this.nestedTasks = undefined;
   }

   scheduleTask(task: TaskRef) {
      if (this.runningTasks) {
         const nested = this.nestedTasks ?? (this.nestedTasks = [])
         nested.push(task)
      }
      else {
         this.queue.push(task)
      }
   }
}
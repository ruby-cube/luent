
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
   extendedQueue: TaskRef[] | undefined
   queue: TaskRef[] = []
   retainedTasks: TaskRef[] | undefined

   runningEffects: boolean = false;

   runEffects() {
      this.runningEffects = true;
      const tasks = this.queue

      for (const task of tasks) {
         if (task.fn) {
            try {
               task.fn()
            }
            finally {
               this.retain(task)
            }
         }
      }
      this.runningEffects = false;

      this.queue = this.extendedQueue ?? []
      this.extendedQueue = undefined;
   }

   retain(task: TaskRef) {
      if (!task.fn) return;
      const retainedTasks = this.retainedTasks ?? (this.retainedTasks = [])
      retainedTasks.push(task)
   }

   scheduleTask(task: TaskRef) {
      if (this.runningEffects) {
         const extension = this.extendedQueue ?? (this.extendedQueue = [])
         extension.push(task)
      }
      else {
         if (this.retainedTasks) {
            this.queue = this.retainedTasks
            this.retainedTasks = undefined;
         }
         this.queue.push(task)
      }
   }
}
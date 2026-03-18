

type OverrideClassesIon = Ion<string | Falsey> & {
   [OVERRIDE_LEVEL]: number;
}

export const OVERRIDE_LEVEL = Symbol('override-level')

export function createOverrideClasses(classes: ClassInput | ClassInput[]) {
   const æclasses = Ion((() => {
      if (æclasses[OVERRIDE_LEVEL]) {
         return toOverrideClasses(normalizeToArray(classes), æclasses[OVERRIDE_LEVEL])
      }
      console.log('override', classes)
      return classes;
   }) as ClassInput | ClassInput[], {
      [OVERRIDE_LEVEL]: 0
   })

   return æclasses;
}

// TODO: add css rules
function toOverrideClasses(classes: ClassInput[], level: number) {
   return classes.map(input => {
      if (!input) return;
      if (isOverrideClasses(input)) {
         return input();
      }
      else {
         const value = toValue(input)
         if (!value) return;
         if (typeof value !== 'string') throw new Error('This should never happen. æclasses should have been handled by preceding if-block')
         const classes = value.split(' ')
         return classes.reduce((classString) => {
            return 'ovrrd' + level + '-' + classString.trim() + ' '
         }, '')
      }
   })
}


function isOverrideClasses(value: any): value is OverrideClassesIon {
   return isIon(value) && OVERRIDE_LEVEL in value
}


// MaybeIon<string | false | null | undefined> | $Classes

class Classes {
   private classesToRemove: undefined | Set<string>
   flask = getFlask()

   constructor(
      public classList: DOMTokenList,
      public rawClasses: ClassInput[]
   ) {
   }

   useClassesToRemove() {
      return this.classesToRemove ?? (this.classesToRemove = new Set())
   }

   addStaticClasses(classString: string) {
      queueInternalRender(() => {
         this.toClassNames(classString).forEach(className => {
            if (className)
               this.classList.add(className)
         })
      }, this.flask)
   }

   markRemoval(classString: string) {
      this.toClassNames(classString).forEach(className =>
         this.useClassesToRemove().add(className)
      )
   }

   addDynamicClasses(classString: string) {
      this.toClassNames(classString).forEach(className => {
         queueInternalRender(() => {
            if (className)
               this.classList.add(className)
         }, this.flask)
      })
   }

   toClassNames(classString: string) {
      return classString.split(' ').map(c => c.trim())
   }

   updateClassList() {
      queueIonicPrelude(() => {
         const currentClasses = this.getCurrentClasses()
         const classesToRemove = this.classesToRemove
         if (classesToRemove) {
            queueInternalRender(() => {
               for (const className of classesToRemove) {
                  if (currentClasses.has(className)) continue;
                  this.classList.remove(className)
               }
            }, this.flask)
            classesToRemove.clear()
         }
      })
   }

   getCurrentClasses() {
      const currentClasses = new Set()
      const queue = [this.rawClasses]
      for (let i = 0; i < queue.length; i++) {
         const rawClasses = queue[0]
         for (const entry of rawClasses) {
            const value = toValue(entry)
            if (!value) continue;
            if (typeof value === 'string') {
               this.toClassNames(value).forEach((className) => currentClasses.add(className))
            }
            else {
               queue.push(value)
            }
         }
      }
      return currentClasses
   }

   update(next: string | Falsey | ClassInput[], prev: string | Falsey | ClassInput[]) {
      if (next instanceof Array) {
         this.processClassInput(next)
      }
      else if (!prev && typeof next === 'string') {
         this.addStaticClasses(next)
      }
      else if (typeof prev === 'string' && !next) {
         this.markRemoval(prev)
      }
      else if (typeof prev === 'string' && typeof next === 'string') {
         this.markRemoval(prev)
         this.addDynamicClasses(next)
      }
      else {
         if (next) console.error('Mismatch of previous and current class ion values', prev, next)
      }
   }


   processClassInput(rawClasses = this.rawClasses, level = 0) {
      for (const entry of rawClasses) {
         if (!entry) continue;
         if (isGetter(entry)) {
            watchToRender(entry as Ion<string | Falsey | ClassInput[]>, ({ previous }) => {
               this.update(entry(), previous) // TODO: set up override rules
            }, this.flask, RUN_EAGERLY)
         }
         else if (entry) {
            this.addStaticClasses(entry)
         }
      }
   }
}

function setUpClasses(node: Element, rawClasses: ClassInput[]) {
   console.log('rawClasses', rawClasses)
   const classList = node.classList
   const classes = new Classes(classList, rawClasses)
   classes.processClassInput()
   classes.updateClassList()
}

let prefix = "@%"

export const debug = {
   action(action: string, ...details: any[][]) {
      log(prefix)
      log(prefix, `ACTION---------------------`)
      log(prefix, `${action}`)
      log(prefix, `${action}`)
      for (const info of details) {
         log(prefix, ...info)
      }
   },

   log,
   warn,
   error,
   throw: throwError
}


const logs = [];

function log(...details: any[]) {
   if (__DEV__) console.log(...details)
   else {
      logs.push({ type: 'log', details })
   }
}

function error(...details: any[]) {
   if (__DEV__) console.error(...details)
   else {
      logs.push({ type: 'error', details })
   }
}

function throwError(...details: any[]) {
   if (__DEV__) console.error(...details)
   else {
      logs.push({ type: 'error', details })
   }
}

function warn(...details: any[]) {
   if (__DEV__) console.warn(...details)
   else {
      logs.push({ type: 'warn', details })
   }
}



export function getTrace() {
   try {
      throw new Error('trace')
   }
   catch (err) {
      return err instanceof Error ? err.stack ?? err : err
   }
}
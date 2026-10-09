import { $_run_with_, $_snap_context } from "@luently/flask"
import { getActiveUpdate, popUpdate, pushUpdate } from "@luently/quarky"

export function $_preserve_context() {
  const update = getActiveUpdate()
  const context = $_snap_context()
  return {
    $_with_context(fn: () => any) {
      if (!update) return $_run_with_(context, fn)
      const sameCycle = !update.committed
      try {
        if (sameCycle) pushUpdate(update!)
        return $_run_with_(context, fn)
      }
      finally {
        if (sameCycle) popUpdate()
      }
    }
  }
}

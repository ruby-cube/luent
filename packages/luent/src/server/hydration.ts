// gernerated by ChatGPT

type HydrationId = string

export class HydrationIdGenerator {
  private componentPath: number[] = []
  private childIndexStack: number[] = [0]
  private localIndexStack: number[] = [0]

  constructor(private rootId: string) {}

  nextLocalId(prefix = "e"): HydrationId {
    const localIndex = this.localIndexStack[this.localIndexStack.length - 1]++
    return `${this.rootId}:${this.pathString()}/${prefix}${localIndex}`
  }

  enterComponent(): void {
    const parentChildIndex =
      this.childIndexStack[this.childIndexStack.length - 1]++

    this.componentPath.push(parentChildIndex)
    this.childIndexStack.push(0)
    this.localIndexStack.push(0)
  }

  exitComponent(): void {
    this.componentPath.pop()
    this.childIndexStack.pop()
    this.localIndexStack.pop()
  }

  private pathString(): string {
    return this.componentPath.length === 0
      ? "$"
      : this.componentPath.join(".")
  }
}
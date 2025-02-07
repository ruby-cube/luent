export interface DEVLabellable {
   __DEV__labelName?: string
   __DEV__label: (label: string) => void
}

export function __DEV__label(this: DEVLabellable, label: string) {
   this.__DEV__labelName = label;
}

//QUESTION: dunno if this applies to only capsules or also effects
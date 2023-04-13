export class ExtensibleRef {
    private _value: any;
    public get value(): any {
        return this._value;
    }
}

export function isExtensibleRef(value: any): value is ExtensibleRef {
    return value instanceof ExtensibleRef
}
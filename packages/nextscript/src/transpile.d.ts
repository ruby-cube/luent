export declare function transpileNextScript(file: string, source: string): {
    source: string;
    transpiled: {
        ast: any;
        code: string;
    };
    map: import("@volar/language-core").CodeMapping[];
    sourceMap: import("@jridgewell/gen-mapping").EncodedSourceMap;
};

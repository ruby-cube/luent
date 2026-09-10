import type { CodeMapping } from "@volar/language-core/lib/types";
export type Capabilities = CodeMapping['data'];
export type BaseCapabilities = {
    completion: true;
    navigation: true;
    semantic: true;
    verification: true;
};
export type NoCapabilities = {
    completion: false;
    navigation: false;
    semantic: false;
    verification: false;
};
export declare const BASE_CAPABILITIES: {
    verification: boolean;
    semantic: boolean;
    navigation: boolean;
    completion: boolean;
};
export declare const NO_CAPABILITIES: {
    verification: boolean;
    completion: boolean;
    semantic: boolean;
    navigation: boolean;
};
export declare const SEMANTIC_ONLY: {
    verification: boolean;
    semantic: boolean;
    navigation: boolean;
    completion: boolean;
};
export declare const COMPLETION_ONLY: {
    completion: boolean;
    verification: boolean;
    semantic: boolean;
    navigation: boolean;
};
export declare const STRUCTURE_ONLY: {
    verification: boolean;
    completion: boolean;
    semantic: boolean;
    navigation: boolean;
    structure: boolean;
};

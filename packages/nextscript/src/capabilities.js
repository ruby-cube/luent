export const BASE_CAPABILITIES = {
    verification: true,
    semantic: true,
    navigation: true,
    completion: true,
};
export const NO_CAPABILITIES = {
    verification: false,
    completion: false,
    semantic: false,
    navigation: false,
};
export const SEMANTIC_ONLY = {
    verification: true,
    semantic: true,
    navigation: true,
    completion: false,
};
export const COMPLETION_ONLY = {
    completion: true,
    verification: false,
    semantic: false,
    navigation: false,
};
export const STRUCTURE_ONLY = {
    verification: false,
    completion: false,
    semantic: false,
    navigation: false,
    structure: true,
};

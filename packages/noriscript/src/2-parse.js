import { parseSync } from 'oxc-parser';
export function parseNSX(file, code) {
    return parseSync(file, code, {
        astType: 'ts',
        lang: 'tsx',
        preserveParens: true,
        sourceType: 'module'
    });
}

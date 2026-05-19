
// Set __DEV__ globally for test execution
if (typeof globalThis !== 'undefined') {
   (globalThis as any).__DEV__ = false;
   (globalThis as any).__TEST__ = true;
}

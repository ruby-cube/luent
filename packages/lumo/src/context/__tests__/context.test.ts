import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fromApp, fromContext, createGlobalCommons, fromGlobal } from '../provide';
import { template, makeComponent } from '../../component/Component';
import { createRoot } from '../../createRoot';
import { makeElement } from '../../element/makeElement';
import { JSDOM } from 'jsdom'
import { Commons, createCommons } from '../Context';
import { ContextKey } from '../ContextKey';
import { Ion, Ionized, MaybeIon, v } from '../../component/Input';
import { ion, ionize, isIon, isIonicProxy } from '@rue/quarky';


// Common setup to reset the environment before each test
beforeEach(() => {
    const dom = new JSDOM()
    const window = dom.window
    vi.stubGlobal('Element', window.Element)
    vi.stubGlobal('Text', window.Text)
    vi.stubGlobal('document', dom.window.document)
});

const _frog_ = 'frog'

describe('Integration tests the Context API', () => {
    describe('createRoot() with appwide context', () => {

        it('should provide all components with context entries', () => {

            const value = 'sir robin'
            let frogA;
            let frogB;
            let frogC;
            let frogD;
            let frogE;

            function App() {
                frogA = fromApp(_frog_)
                return template(
                  makeComponent(Parent, undefined, {}, undefined)
               )
            }

            function Parent() {
                frogB = fromApp(_frog_)

                return template(
                    makeElement('div', () => [
                        makeComponent(Child, undefined, {}, undefined),
                        makeComponent(Sibling, undefined, {}, undefined)
                    ], {}, undefined)
                )
            }

            function Child() {
                frogC = fromApp(_frog_)
                frogD = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            function Sibling() {
                frogE = fromApp(_frog_)

                return template(
                    makeElement('div', () => ['sibling'], {}, undefined)
                )
            }
            const app = createRoot(App, { with: { [_frog_]: value } });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frogA).toBe(value)
            expect(frogB).toBe(value)
            expect(frogC).toBe(value)
            expect(frogD).toBe(value)
            expect(frogE).toBe(value)
        });

        it('should not provide outside of app', () => {
            const value = 'sir robin'
            let frog;
            let frogB;

            function App() {
                frog = fromApp(_frog_)
                frogB = fromGlobal(_frog_)

                return template(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = createRoot(App, { with: { [_frog_]: value } });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBe(value)
            expect(frogB).toBeUndefined()
            expect(() => fromApp(_frog_)).toThrow()
        })

        it('should return undefined if value not provided', () => {
            const value = 'sir robin'
            let cat;
            function App() {
                cat = fromApp('cat')
                return template(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = createRoot(App, { with: { [_frog_]: value } });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(cat).toBe(undefined)
        })

        it('should return undefined if no entries provided', () => {
            let frog;
            function App() {
                frog = fromApp(_frog_)
                return template(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))
            expect(frog).toBe(undefined)
        })
    });

    describe('createGlobalCommons()', () => {
        it('should create a trans-app context accessible across the application', () => {
            const value = 'sir robin'
            const globalCommons = createGlobalCommons({ [_frog_]: value });

            let frog;
            let frogB;

            function App() {
                frog = fromApp(_frog_)
                frogB = fromGlobal(_frog_)

                return template(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = createRoot(App, { globalCommons });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(globalCommons).toBeDefined();
            expect(frog).toBe(value)
            expect(frogB).toBe(value)
            expect(() => fromGlobal(_frog_)).toThrow()

        });

        it('should create a trans-app context accessible across the application', () => {
            const globalCommons = createGlobalCommons();
            expect(globalCommons).toBeDefined();
        });
    });

    // describe('provideGlobal() and global()', () => {
    //     it('should provide a global value accessible from anywhere in the application', () => {
    //         const globalCommons = createGlobalCommons();
    //         provideGlobal(globalCommons, 'globalConfig', { theme: 'dark' });
    //         const config = global(globalCommons, 'globalConfig');
    //         expect(config).toEqual({ theme: 'dark' });
    //     });

    //     it('should override global values if provided again', () => {
    //         const globalCommons = createGlobalCommons();
    //         provideGlobal(globalCommons, 'globalConfig', { theme: 'dark' });
    //         provideGlobal(globalCommons, 'globalConfig', { theme: 'light' });
    //         const config = global(globalCommons, 'globalConfig');
    //         expect(config).toEqual({ theme: 'light' });
    //     });
    // });

    describe('Context() and fromContext()', () => {
        it('should provide all child components with context entries', () => {

            const value = 'sir robin'
            let frogA;
            let frogB;
            let frogC;
            let frogD;
            let frogE;

            function App() {
                frogA = fromApp(_frog_)
                return template(
                    Commons({ Slot: () => [
                     makeComponent(Parent, undefined, {}, undefined)
                 ],provide: { [_frog_]: value } })
                )
            }

            function Parent() {
                frogB = fromApp(_frog_)
                frogC = fromContext(_frog_)

                return template(
                    makeElement('div', () => [
                        makeComponent(Child, undefined, {}, undefined),
                        makeComponent(Sibling, undefined, {}, undefined)
                    ], {}, undefined)
                )
            }

            function Child() {
                frogD = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            function Sibling() {
                frogE = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['sibling'], {}, undefined)
                )
            }
            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frogA).toBeUndefined()
            expect(frogB).toBeUndefined()
            expect(frogC).toBe(value)
            expect(frogD).toBe(value)
            expect(frogE).toBe(value)
        });

        it('should not provide to non-child components', () => {

            const value = 'sir robin'

            let frogD;
            let frogE;

            function Parent() {

                return template(
                    makeElement('div', () => [
                        createCommons(() => [
                            makeComponent(Child, undefined, {}, undefined),
                        ], { provide: { [_frog_]: value } }),
                        makeComponent(Sibling, undefined, {}, undefined)
                    ], {}, undefined)
                )
            }

            function Child() {
                frogD = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            function Sibling() {
                frogE = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['sibling'], {}, undefined)
                )
            }
            const app = createRoot(Parent);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frogD).toBe(value)
            expect(frogE).toBeUndefined()
        });

        it('should climb context tree to locate values', () => {

            const GLOBAL_FROG = 'global_frog'
            const APP_FROG = 'app_frog'
            const APP_CONTEXTUAL_FROG = 'app_contextual_frog'
            const CONTEXTUAL_FROG = 'contextual_frog'

            const globalValue = 1
            const appValue = 2
            const appContextualValue = 3
            const contextualValue = 4

            let frogA;
            let frogB;
            let frogC;
            let frogD;
            let frogE;
            let frogF;

            function App() {

                return template(
                    createCommons(() => [
                        makeComponent(Parent, undefined, {}, undefined)
                    ], { provide: { [APP_CONTEXTUAL_FROG]: appContextualValue } })
                )
            }

            function Parent() {

                return template(
                    makeElement('div', () => [
                        createCommons(() => [
                            makeComponent(Child, undefined, {}, undefined),
                        ], { provide: { [CONTEXTUAL_FROG]: contextualValue } })
                    ], {}, undefined)
                )
            }

            function Child() {
                frogA = fromGlobal(GLOBAL_FROG)
                frogB = fromApp(APP_FROG)

                frogC = fromContext(GLOBAL_FROG)
                frogD = fromContext(APP_FROG)
                frogE = fromContext(APP_CONTEXTUAL_FROG)
                frogF = fromContext(CONTEXTUAL_FROG)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const globalCommons = createGlobalCommons({ [GLOBAL_FROG]: globalValue })
            const app = createRoot(App, { with: { [APP_FROG]: appValue }, globalCommons });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frogA).toBe(globalValue)
            expect(frogB).toBe(appValue)
            expect(frogC).toBe(globalValue)
            expect(frogD).toBe(appValue)
            expect(frogE).toBe(appContextualValue)
            expect(frogF).toBe(contextualValue)
        });
    });



    // it should validate Ionized


    describe('ContextKey and validation', () => {
        it('should throw an error if required context prop is not provided', () => {

            const value = 0
            const _frog_ = 'frog'
            ContextKey(_frog_, v)
            let frog;

            const KERMIT = 'kermit'
            ContextKey(KERMIT, v)

            function App() {
                return template(
                    createCommons(() => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { provide: { [_frog_]: value } })
                )
            }

            let error;

            function Child() {
                frog = fromContext(_frog_)
                try {
                    fromContext(KERMIT)
                }
                catch (err) {
                    error = err
                    console.error(err)
                }
                finally {
                    return template(
                        makeElement('div', () => ['child'], {}, undefined)
                    )
                }
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(error).toBeDefined()
            expect(frog).toBe(value)
        });

        it('should allow optional props to be undefined', () => {

            const _frog_ = 'frog'
            ContextKey(_frog_, v('?'))
            let frog = 'hi'

            function App() {
                return template(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }


            function Child() {
                frog = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBeUndefined()
        });

        it('should use default if provided and prop is undefined', () => {

            const _frog_ = 'frog'
            const defaultValue = 'kermit'
            ContextKey(_frog_, v('?')(() => defaultValue))
            let frog = 'hi'

            function App() {
                return template(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBe(defaultValue)
        });

        it('should normalize MaybeIon', () => {

            const _frog_ = 'frog'
            const value = 'kermit'
            ContextKey(_frog_, MaybeIon)
            let frog = 'hi'

            function App() {
                return template(
                    createCommons(() => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { provide: { [_frog_]: value } })
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIon(frog)).toBe(true)
            expect((<Function><unknown>frog)()).toBe(value)
        });

        it('should validate Ion', () => {

            const _frog_ = 'frog'
            const value = 'kermit'
            ContextKey(_frog_, Ion)
            let frog = 'hi'

            function App() {
                return template(
                    createCommons(() => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { provide: { [_frog_]: value } })
                )
            }

            let error;

            function Child() {
                try {
                    frog = fromContext(_frog_)

                }
                catch (err) {
                    error = err
                    console.error(err)
                }
                finally {
                    return template(
                        makeElement('div', () => ['child'], {}, undefined)
                    )
                }
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(error).toBeDefined()
        });

        it('should validate Ionized', () => {

            const _frog_ = 'frog'
            const value = 'kermit'
            ContextKey(_frog_, Ionized)
            let frog = 'hi'

            function App() {
                return template(
                    createCommons(() => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { provide: { [_frog_]: value } })
                )
            }

            let error;

            function Child() {
                try {
                    frog = fromContext(_frog_)
                }
                catch (err) {
                    error = err
                    console.error(err)
                }
                finally {
                    return template(
                        makeElement('div', () => ['child'], {}, undefined)
                    )
                }
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(error).toBeDefined()
        });


        it('should provide Ion', () => {

            const _frog_ = 'frog'
            const value = 'kermit'
            ContextKey(_frog_, Ion)
            let frog = 'hi'

            function App() {
                return template(
                    createCommons(() => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { provide: { [_frog_]: Ion(value) } })
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIon(frog)).toBe(true)
        });


        it('should provide Ionized', () => {

            const _frog_ = 'frog'
            const value = { name: 'kermit' }
            ContextKey(_frog_, Ionized)
            let frog = 'hi'

            function App() {
                return template(
                    createCommons(() => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { provide: { [_frog_]: ionize(value) } })
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIonicProxy(frog)).toBe(true)
        });


        it('should allow MaybeIon to be undefined if optional', () => {

            const _frog_ = 'frog'
            ContextKey(_frog_, MaybeIon('?'))
            let frog = 'hi'

            function App() {
                return template(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBeUndefined()
        });


        it('should provide default for MaybeIon', () => {

            const _frog_ = 'frog'
            const defaultValue = 'kermit'
            ContextKey(_frog_, MaybeIon('?')(() => defaultValue))
            let frog = 'hi'

            function App() {
                return template(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return template(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createRoot(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIon(frog)).toBe(true)
            expect((<Function><unknown>frog)()).toBe(defaultValue)

        });

    });
});

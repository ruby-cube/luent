import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fromRoot, fromContext, createGroundContext, fromGround } from '../provide';
import { template, makeComponent } from '../../component/component';
import { mount } from '../../mount';
import { makeElement } from '../../element/makeElement';
import { JSDOM } from 'jsdom'
import { Context, createContext } from '../Context';
import { ContextKey } from '../ContextKey';
import { Ion, Ionized, MaybeIon, v } from '../../component/x-Input';
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
    describe('mount() with appwide context', () => {

        it('should provide all components with context entries', () => {

            const value = 'sir robin'
            let frogA;
            let frogB;
            let frogC;
            let frogD;
            let frogE;

            function App() {
                frogA = fromRoot(_frog_)
                return component(
                  makeComponent(Parent, undefined, {}, undefined)
               )
            }

            function Parent() {
                frogB = fromRoot(_frog_)

                return component(
                    makeElement('div', () => [
                        makeComponent(Child, undefined, {}, undefined),
                        makeComponent(Sibling, undefined, {}, undefined)
                    ], {}, undefined)
                )
            }

            function Child() {
                frogC = fromRoot(_frog_)
                frogD = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            function Sibling() {
                frogE = fromRoot(_frog_)

                return component(
                    makeElement('div', () => ['sibling'], {}, undefined)
                )
            }
            const app = mount(App, { with: { [_frog_]: value } });

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
                frog = fromRoot(_frog_)
                frogB = fromGround(_frog_)

                return component(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = mount(App, { with: { [_frog_]: value } });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBe(value)
            expect(frogB).toBeUndefined()
            expect(() => fromRoot(_frog_)).toThrow()
        })

        it('should return undefined if value not provided', () => {
            const value = 'sir robin'
            let cat;
            function App() {
                cat = fromRoot('cat')
                return component(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = mount(App, { with: { [_frog_]: value } });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(cat).toBe(undefined)
        })

        it('should return undefined if no entries provided', () => {
            let frog;
            function App() {
                frog = fromRoot(_frog_)
                return component(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))
            expect(frog).toBe(undefined)
        })
    });

    describe('createGroundContext()', () => {
        it('should create a trans-app context accessible across the application', () => {
            const value = 'sir robin'
            const groundContext = createGroundContext({ [_frog_]: value });

            let frog;
            let frogB;

            function App() {
                frog = fromRoot(_frog_)
                frogB = fromGround(_frog_)

                return component(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = mount(App, { groundContext });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(groundContext).toBeDefined();
            expect(frog).toBe(value)
            expect(frogB).toBe(value)
            expect(() => fromGround(_frog_)).toThrow()

        });

        it('should create a trans-app context accessible across the application', () => {
            const groundContext = createGroundContext();
            expect(groundContext).toBeDefined();
        });
    });

    // describe('provideGround() and global()', () => {
    //     it('should provide a global value accessible from anywhere in the application', () => {
    //         const groundContext = createGroundContext();
    //         provideGround(groundContext, 'globalConfig', { theme: 'dark' });
    //         const config = global(groundContext, 'globalConfig');
    //         expect(config).toEqual({ theme: 'dark' });
    //     });

    //     it('should override global values if provided again', () => {
    //         const groundContext = createGroundContext();
    //         provideGround(groundContext, 'globalConfig', { theme: 'dark' });
    //         provideGround(groundContext, 'globalConfig', { theme: 'light' });
    //         const config = global(groundContext, 'globalConfig');
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
                frogA = fromRoot(_frog_)
                return component(
                    Context({ Slot: () => [
                     makeComponent(Parent, undefined, {}, undefined)
                 ],provide: { [_frog_]: value } })
                )
            }

            function Parent() {
                frogB = fromRoot(_frog_)
                frogC = fromContext(_frog_)

                return component(
                    makeElement('div', () => [
                        makeComponent(Child, undefined, {}, undefined),
                        makeComponent(Sibling, undefined, {}, undefined)
                    ], {}, undefined)
                )
            }

            function Child() {
                frogD = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            function Sibling() {
                frogE = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['sibling'], {}, undefined)
                )
            }
            const app = mount(App);

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

                return component(
                    makeElement('div', () => [
                        createContext(() => [
                            makeComponent(Child, undefined, {}, undefined),
                        ], { provide: { [_frog_]: value } }),
                        makeComponent(Sibling, undefined, {}, undefined)
                    ], {}, undefined)
                )
            }

            function Child() {
                frogD = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            function Sibling() {
                frogE = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['sibling'], {}, undefined)
                )
            }
            const app = mount(Parent);

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

                return component(
                    createContext(() => [
                        makeComponent(Parent, undefined, {}, undefined)
                    ], { provide: { [APP_CONTEXTUAL_FROG]: appContextualValue } })
                )
            }

            function Parent() {

                return component(
                    makeElement('div', () => [
                        createContext(() => [
                            makeComponent(Child, undefined, {}, undefined),
                        ], { provide: { [CONTEXTUAL_FROG]: contextualValue } })
                    ], {}, undefined)
                )
            }

            function Child() {
                frogA = fromGround(GLOBAL_FROG)
                frogB = fromRoot(APP_FROG)

                frogC = fromContext(GLOBAL_FROG)
                frogD = fromContext(APP_FROG)
                frogE = fromContext(APP_CONTEXTUAL_FROG)
                frogF = fromContext(CONTEXTUAL_FROG)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const groundContext = createGroundContext({ [GLOBAL_FROG]: globalValue })
            const app = mount(App, { with: { [APP_FROG]: appValue }, groundContext });

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
                return component(
                    createContext(() => [
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
                    return component(
                        makeElement('div', () => ['child'], {}, undefined)
                    )
                }
            }

            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(error).toBeDefined()
            expect(frog).toBe(value)
        });

        it('should allow optional props to be undefined', () => {

            const _frog_ = 'frog'
            ContextKey(_frog_, v('?'))
            let frog = 'hi'

            function App() {
                return component(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }


            function Child() {
                frog = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBeUndefined()
        });

        it('should use default if provided and prop is undefined', () => {

            const _frog_ = 'frog'
            const defaultValue = 'kermit'
            ContextKey(_frog_, v('?')(() => defaultValue))
            let frog = 'hi'

            function App() {
                return component(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBe(defaultValue)
        });

        it('should normalize MaybeIon', () => {

            const _frog_ = 'frog'
            const value = 'kermit'
            ContextKey(_frog_, MaybeIon)
            let frog = 'hi'

            function App() {
                return component(
                    createContext(() => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { provide: { [_frog_]: value } })
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = mount(App);

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
                return component(
                    createContext(() => [
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
                    return component(
                        makeElement('div', () => ['child'], {}, undefined)
                    )
                }
            }

            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(error).toBeDefined()
        });

        it('should validate Ionized', () => {

            const _frog_ = 'frog'
            const value = 'kermit'
            ContextKey(_frog_, Ionized)
            let frog = 'hi'

            function App() {
                return component(
                    createContext(() => [
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
                    return component(
                        makeElement('div', () => ['child'], {}, undefined)
                    )
                }
            }

            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(error).toBeDefined()
        });


        it('should provide Ion', () => {

            const _frog_ = 'frog'
            const value = 'kermit'
            ContextKey(_frog_, Ion)
            let frog = 'hi'

            function App() {
                return component(
                    createContext(() => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { provide: { [_frog_]: ion(value) } })
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIon(frog)).toBe(true)
        });


        it('should provide Ionized', () => {

            const _frog_ = 'frog'
            const value = { name: 'kermit' }
            ContextKey(_frog_, Ionized)
            let frog = 'hi'

            function App() {
                return component(
                    createContext(() => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { provide: { [_frog_]: ionize(value) } })
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIonicProxy(frog)).toBe(true)
        });


        it('should allow MaybeIon to be undefined if optional', () => {

            const _frog_ = 'frog'
            ContextKey(_frog_, MaybeIon('?'))
            let frog = 'hi'

            function App() {
                return component(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBeUndefined()
        });


        it('should provide default for MaybeIon', () => {

            const _frog_ = 'frog'
            const defaultValue = 'kermit'
            ContextKey(_frog_, MaybeIon('?')(() => defaultValue))
            let frog = 'hi'

            function App() {
                return component(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }

            function Child() {
                frog = fromContext(_frog_)

                return component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = mount(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIon(frog)).toBe(true)
            expect((<Function><unknown>frog)()).toBe(defaultValue)

        });

    });
});

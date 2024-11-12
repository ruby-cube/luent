import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appwide, contextual, createTransappContext, transapp } from '../provide';
import { Component } from '../../component/InternalComponent';
import { createApp } from '../../createApp';
import { makeComponent } from '../../component/makeComponent';
import { makeElement } from '../../element/makeElement';
import { JSDOM } from 'jsdom'
import { Context, createNodeContext } from '../Context';
import { defineContextProp } from '../ContextKey';
import { Ion, Ionized, MaybeIon, v } from '../../InputTypes';
import { ion, ionize, isIon, isIonicModel } from '@rue/quarky';


// Common setup to reset the environment before each test
beforeEach(() => {
    const dom = new JSDOM()
    const window = dom.window
    vi.stubGlobal('Element', window.Element)
    vi.stubGlobal('Text', window.Text)
    vi.stubGlobal('document', dom.window.document)
});

const FROG = 'frog'

describe('Integration tests the Context API', () => {
    describe('createApp() with appwide context', () => {

        it('should provide all components with context entries', () => {

            const value = 'sir robin'
            let frogA;
            let frogB;
            let frogC;
            let frogD;
            let frogE;

            function App() {
                frogA = appwide(FROG)
                return Component(makeComponent(Parent, undefined, {}, undefined))
            }

            function Parent() {
                frogB = appwide(FROG)

                return Component(
                    makeElement('div', () => [
                        makeComponent(Child, undefined, {}, undefined),
                        makeComponent(Sibling, undefined, {}, undefined)
                    ], {}, undefined)
                )
            }

            function Child() {
                frogC = appwide(FROG)
                frogD = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            function Sibling() {
                frogE = appwide(FROG)

                return Component(
                    makeElement('div', () => ['sibling'], {}, undefined)
                )
            }
            const app = createApp(App, { with: { [FROG]: value } });

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
                frog = appwide(FROG)
                frogB = transapp(FROG)

                return Component(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = createApp(App, { with: { [FROG]: value } });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBe(value)
            expect(frogB).toBeUndefined()
            expect(() => appwide(FROG)).toThrow()
        })

        it('should return undefined if value not provided', () => {
            const value = 'sir robin'
            let cat;
            function App() {
                cat = appwide('cat')
                return Component(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = createApp(App, { with: { [FROG]: value } });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(cat).toBe(undefined)
        })

        it('should return undefined if no entries provided', () => {
            let frog;
            function App() {
                frog = appwide(FROG)
                return Component(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))
            expect(frog).toBe(undefined)
        })
    });

    describe('createTransappContext()', () => {
        it('should create a trans-app context accessible across the application', () => {
            const value = 'sir robin'
            const transappContext = createTransappContext({ [FROG]: value });

            let frog;
            let frogB;

            function App() {
                frog = appwide(FROG)
                frogB = transapp(FROG)

                return Component(
                    makeElement('div', () => ['hi'], {}, undefined)
                )
            }
            const app = createApp(App, { transappContext });

            app.mount(<HTMLElement>document.createElement('div'))

            expect(transappContext).toBeDefined();
            expect(frog).toBe(value)
            expect(frogB).toBe(value)
            expect(() => transapp(FROG)).toThrow()

        });

        it('should create a trans-app context accessible across the application', () => {
            const globalContext = createTransappContext();
            expect(globalContext).toBeDefined();
        });
    });

    // describe('provideTransapp() and global()', () => {
    //     it('should provide a global value accessible from anywhere in the application', () => {
    //         const globalContext = createTransappContext();
    //         provideTransapp(globalContext, 'globalConfig', { theme: 'dark' });
    //         const config = global(globalContext, 'globalConfig');
    //         expect(config).toEqual({ theme: 'dark' });
    //     });

    //     it('should override global values if provided again', () => {
    //         const globalContext = createTransappContext();
    //         provideTransapp(globalContext, 'globalConfig', { theme: 'dark' });
    //         provideTransapp(globalContext, 'globalConfig', { theme: 'light' });
    //         const config = global(globalContext, 'globalConfig');
    //         expect(config).toEqual({ theme: 'light' });
    //     });
    // });

    describe('Context() and contextual()', () => {
        it('should provide all child components with context entries', () => {

            const value = 'sir robin'
            let frogA;
            let frogB;
            let frogC;
            let frogD;
            let frogE;

            function App() {
                frogA = appwide(FROG)
                return Component(
                    createNodeContext(Context, () => [
                        makeComponent(Parent, undefined, {}, undefined)
                    ], { with: { [FROG]: value } })
                )
            }

            function Parent() {
                frogB = appwide(FROG)
                frogC = contextual(FROG)

                return Component(
                    makeElement('div', () => [
                        makeComponent(Child, undefined, {}, undefined),
                        makeComponent(Sibling, undefined, {}, undefined)
                    ], {}, undefined)
                )
            }

            function Child() {
                frogD = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            function Sibling() {
                frogE = contextual(FROG)

                return Component(
                    makeElement('div', () => ['sibling'], {}, undefined)
                )
            }
            const app = createApp(App);

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

                return Component(
                    makeElement('div', () => [
                        createNodeContext(Context, () => [
                            makeComponent(Child, undefined, {}, undefined),
                        ], { with: { [FROG]: value } }),
                        makeComponent(Sibling, undefined, {}, undefined)
                    ], {}, undefined)
                )
            }

            function Child() {
                frogD = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            function Sibling() {
                frogE = contextual(FROG)

                return Component(
                    makeElement('div', () => ['sibling'], {}, undefined)
                )
            }
            const app = createApp(Parent);

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

                return Component(
                    createNodeContext(Context, () => [
                        makeComponent(Parent, undefined, {}, undefined)
                    ], { with: { [APP_CONTEXTUAL_FROG]: appContextualValue } })
                )
            }

            function Parent() {

                return Component(
                    makeElement('div', () => [
                        createNodeContext(Context, () => [
                            makeComponent(Child, undefined, {}, undefined),
                        ], { with: { [CONTEXTUAL_FROG]: contextualValue } })
                    ], {}, undefined)
                )
            }

            function Child() {
                frogA = transapp(GLOBAL_FROG)
                frogB = appwide(APP_FROG)

                frogC = contextual(GLOBAL_FROG)
                frogD = contextual(APP_FROG)
                frogE = contextual(APP_CONTEXTUAL_FROG)
                frogF = contextual(CONTEXTUAL_FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const transappContext = createTransappContext({ [GLOBAL_FROG]: globalValue })
            const app = createApp(App, { with: { [APP_FROG]: appValue }, transappContext });

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


    describe('defineContextProp and validation', () => {
        it('should throw an error if required context prop is not provided', () => {

            const value = 0
            const FROG = 'frog'
            defineContextProp(FROG, v)
            let frog;

            const KERMIT = 'kermit'
            defineContextProp(KERMIT, v)

            function App() {
                return Component(
                    createNodeContext(Context, () => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { with: { [FROG]: value } })
                )
            }

            let error;

            function Child() {
                frog = contextual(FROG)
                try {
                    contextual(KERMIT)
                }
                catch (err) {
                    error = err
                    console.error(err)
                }
                finally {
                    return Component(
                        makeElement('div', () => ['child'], {}, undefined)
                    )
                }
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(error).toBeDefined()
            expect(frog).toBe(value)
        });

        it('should allow optional props to be undefined', () => {

            const FROG = 'frog'
            defineContextProp(FROG, v('?'))
            let frog = 'hi'

            function App() {
                return Component(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }


            function Child() {
                frog = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBeUndefined()
        });

        it('should use default if provided and prop is undefined', () => {

            const FROG = 'frog'
            const defaultValue = 'kermit'
            defineContextProp(FROG, v('?')(() => defaultValue))
            let frog = 'hi'

            function App() {
                return Component(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }

            function Child() {
                frog = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBe(defaultValue)
        });

        it('should normalize MaybeIon', () => {

            const FROG = 'frog'
            const value = 'kermit'
            defineContextProp(FROG, MaybeIon)
            let frog = 'hi'

            function App() {
                return Component(
                    createNodeContext(Context, () => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { with: { [FROG]: value } })
                )
            }

            function Child() {
                frog = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIon(frog)).toBe(true)
            expect((<Function><unknown>frog)()).toBe(value)
        });

        it('should validate Ion', () => {

            const FROG = 'frog'
            const value = 'kermit'
            defineContextProp(FROG, Ion)
            let frog = 'hi'

            function App() {
                return Component(
                    createNodeContext(Context, () => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { with: { [FROG]: value } })
                )
            }

            let error;

            function Child() {
                try {
                    frog = contextual(FROG)

                }
                catch (err) {
                    error = err
                    console.error(err)
                }
                finally {
                    return Component(
                        makeElement('div', () => ['child'], {}, undefined)
                    )
                }
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(error).toBeDefined()
        });

        it('should validate Ionized', () => {

            const FROG = 'frog'
            const value = 'kermit'
            defineContextProp(FROG, Ionized)
            let frog = 'hi'

            function App() {
                return Component(
                    createNodeContext(Context, () => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { with: { [FROG]: value } })
                )
            }

            let error;

            function Child() {
                try {
                    frog = contextual(FROG)
                }
                catch (err) {
                    error = err
                    console.error(err)
                }
                finally {
                    return Component(
                        makeElement('div', () => ['child'], {}, undefined)
                    )
                }
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(error).toBeDefined()
        });


        it('should provide Ion', () => {

            const FROG = 'frog'
            const value = 'kermit'
            defineContextProp(FROG, Ion)
            let frog = 'hi'

            function App() {
                return Component(
                    createNodeContext(Context, () => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { with: { [FROG]: ion(value) } })
                )
            }

            function Child() {
                frog = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIon(frog)).toBe(true)
        });


        it('should provide Ionized', () => {

            const FROG = 'frog'
            const value = { name: 'kermit' }
            defineContextProp(FROG, Ionized)
            let frog = 'hi'

            function App() {
                return Component(
                    createNodeContext(Context, () => [
                        makeComponent(Child, undefined, {}, undefined)
                    ], { with: { [FROG]: ionize(value) } })
                )
            }

            function Child() {
                frog = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIonicModel(frog)).toBe(true)
        });


        it('should allow MaybeIon to be undefined if optional', () => {

            const FROG = 'frog'
            defineContextProp(FROG, MaybeIon('?'))
            let frog = 'hi'

            function App() {
                return Component(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }

            function Child() {
                frog = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(frog).toBeUndefined()
        });


        it('should provide default for MaybeIon', () => {

            const FROG = 'frog'
            const defaultValue = 'kermit'
            defineContextProp(FROG, MaybeIon('?')(() => defaultValue))
            let frog = 'hi'

            function App() {
                return Component(
                    makeComponent(Child, undefined, {}, undefined)
                )
            }

            function Child() {
                frog = contextual(FROG)

                return Component(
                    makeElement('div', () => ['child'], {}, undefined)
                )
            }

            const app = createApp(App);

            app.mount(<HTMLElement>document.createElement('div'))

            expect(isIon(frog)).toBe(true)
            expect((<Function><unknown>frog)()).toBe(defaultValue)

        });

    });
});

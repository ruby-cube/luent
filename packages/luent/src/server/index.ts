const globals = globalThis as any
globals.__DEV__ ??= process.env.NODE_ENV === 'development'
globals.__INTERNAL__ ??= process.env.NODE_ENV === 'development'
globals.__SSR__ ??= true
globals.__TEST__ ??= process.env.NODE_ENV === 'test'
globals.__STYLE__ ??= process.env.NODE_ENV === 'style'

export * from './writeHTML'
export * from './writeJSXNode'
export * from './writeIslands'
export * from './portals'
// export { RenderPageWithStyles } from '../component/Style'
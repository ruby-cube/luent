declare module 'react' {
    namespace JSX {
        interface IntrinsicAttributes {
            [key: `@${string}`?]: (event: HTMLElementEventMap[K]) => void // Example for @click attribute
            '@click'?: (event: HTMLElementEventMap[K]) => void // Example for @click attribute
            // Add more custom attributes as needed
        }
    }
}

if (process.env.NODE_ENV === 'development') {
   // lazy import to prevent imports from affecting tests
   import('./demos').then(res => res.runDemo())
}
import babelLumoTransform from '../lumo/babel-plugin/index'
import babel from '@babel/core';

export default function lumoPlugin() {
   return {
      name: 'vite-lumo-plugin',
      async transform(code, id) {
         if (!id.endsWith('.jsx') && !id.endsWith('.tsx')) return;

         const result = await babel.transformAsync(code, {
            plugins: [babelLumoTransform],
            filename: id,
            sourceMaps: true, // Optional, useful for debugging
         });

         return {
            code: result.code,
            map: result.map, // Include source maps
         };
      },
   }
}
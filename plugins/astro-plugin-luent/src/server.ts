import type { NamedSSRLoadedRendererValue } from 'astro';
import { RenderComponent } from './shared';
import { writeIsland, encodePortals, injectPortals, extractPortals } from 'luent/server';

const renderer = {
  name: 'astro-plugin-luent',
  injectPortals,
  extractPortals,

  async check(Component) {
    if (typeof Component !== 'function') return false;
    return true
  },

  async renderToStaticMarkup(Component, setup, children) {
    if (Component.length === 0) {
      return { html: encodePortals(() => writeIsland(Component)) }
    }
    return { html: encodePortals(() => writeIsland(RenderComponent(Component, setup, children))) }
  },
} satisfies NamedSSRLoadedRendererValue & {
  injectPortals: typeof injectPortals;
  extractPortals: typeof extractPortals
};

export default renderer;




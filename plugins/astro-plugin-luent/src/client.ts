import { RenderComponent } from "./shared";
import { mountIsland } from "luent/client";


export default (node: HTMLElement) =>
  async (
    Component: any,
    props: Record<string, unknown>,
    slots: Record<string, string>,
    { client }: { client: string },
  ) => {

    // if (client === 'only') {
    //   element.innerHTML = '';
    // }

    if (node.getAttribute('data-mounted') === '') return;
    node.setAttribute('data-mounted', '')
    const render = RenderComponent(Component, props, slots)
    const inner = node.innerHTML // TODO: nsx block, parse params
    node.innerHTML = ''
    const island = mountIsland(render, node)

    node.addEventListener('astro:unmount', () => island.unmount(), { once: true });
  };
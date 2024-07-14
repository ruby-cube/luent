function createApp(Root: ComponentSetup){

    const root = Root(); // runs setup
    const _render = root.render();
    _render();

    return {
        mount(selector: string){
            const appNode = document.querySelector(selector);
        }
    }
}

export type ComponentSetup = () => Component



function _mX(Comp: any, props: any){
    const comp = Comp();
    const _render = comp.render()
    watch( , _render);


}




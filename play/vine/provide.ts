const type = 0 as unknown;

class Frog {
    stuff: Thing[] = []
    tadpoles: Tadpole[] = []
    fav: Tadpole

    constructor(fav: Tadpole) {
        this.fav = fav
        this.hop()
    }

    hop() {

    }
}

class Tadpole {

}

class Thing {

}

const Froggo = defineNode({
    vines: {
        stuff: Thing,
        tadpoles: Tadpole,
        fav: Tadpole
    },
    get: {
        nafavme() {
            return this.fav
        }

    },
    init(tadpoles: Tadpole[], fav: Tadpole, stuff: Thing[], context: { active: boolean }) {


        this.hop();

        return {
            const: {
                fav
            },
            state: {
                stuff,
                fav,
                tadpoles
            },
            provide: {
                fav
            }
        }
    },

    hop() {

    }

})

function getContext() {

}



function defineNode(config: {
    vines: { [key: string]: any },
    get: { [key: string]: () => any },
    init: (...args: any[]) => any
}) {


}




function initiateVine() {


   const root = Root.create(...args)
}



function create(...args: any[]){
    const context = getContext(this)
    this.init(...args, context)
}

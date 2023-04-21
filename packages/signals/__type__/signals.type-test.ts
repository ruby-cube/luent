import { signalize, $, $mutate, $set, computed$, deepSignalize, deepSignalize$, signalize$ } from "../signals";

//TODO: write type tests

const count$ = $(0);   // shallowRef, signal

const selection$ = $({
    id: "hey",
    start$: $(0)
})



const item = signalize({   // shallowReactive
    bullet: "•",
    blog: 0,
    dog: {
        bellow: "flkjsdfj",
        chree: "sldkfj"
    }
})



const item$ = signalize$({   // shallowRef(shallowReactive())
    bullet: "•",
    blog: [0],
    dog: {
        bellow: "flkjsdfj",
        chree: "sldkfj"
    }
})

const user = deepSignalize({  // reactive
    bullet: "•",
    blog: {
        rhogj: 0,
        blue: {
            horse: "ocot"
        }
    }
})

$set(user.blog$, deepSignalize({
    rhogj: 0,
    blue: {
        horse: "ocot"
    }
}))

item.dog$().bellow

user.blog$().blue$()

const user$ = deepSignalize$({     // ref
    name: "Basil",
    blog: {
        rhogj: 0,
        blue: {
            horse: "ocot"
        }
    }
})

user$().name$

const { blue$, rhogj$ } = user$().blog$()




const list = {
    bullet$: $("*"),

    setBullet(value: string) {
        $set(this.bullet$, value)
    }
}


const doubleCount$ = computed$(() => count$() * 2);

$set(count$, count$() + 1);


const listItems$ = $([1, 2, 3]);

listItems$()[1];


$mutate(listItems$, (items) => items.push(1))

$set(user$, {
    name$: $(""),
    blog$: $({
        blue$: $({
            horse$: $("")
        }),
        rhogj$: $(0)
    })
})

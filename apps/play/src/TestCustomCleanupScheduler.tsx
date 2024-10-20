//@ts-nocheck
import { Component, NodeRef, watch } from "@rue/lumo"
import { AnyIon, DerivedIon, Ion, ion, ionize, watchIonicEffect, } from "@rue/quarky"
import { asPropIon } from "../../../packages/quarky/src/ionize/PropIon"
import { or, $setup, is, isDefined, isAny, not } from "../../../packages/lumo/src/component/$setup"
import { toIon } from "../../../packages/quarky/src/ion/toIons"
import { AnyObject } from "@rue/types"

// optional and default
// normalize
// validate

function type<T>(value: any): value is T {
    return true
}

const eh = type<{
    hi: 'hi'
}>

type MaybeIon<T> = T | Ion<T>

type Huh = number | never

const ALL = Symbol('normalize-all')

const oh = toIon('hi' as MaybeIon<string>)


export function Bog(setup: {
    name?: MaybeIon<string>,
    date: Date,
    address: MaybeIonized<{ // must not have methods, will be auto-protected by Lumo
        street: string,
        zip: number
    }>,
    $frog: Ionized<{
        name: string,
        setName: (name: string) => void
    }>
}) {
    // normalize and set defaults
    setup.name = setup.name ?? 'sir robin'

    const {
        $name,
        $date,
        $address,
        $frog
    } = toIonicProps(setup, {
        name: toIon,
        date: toIonized,
        address: false,
        $frog: assertIonized
    })

    const $name = toIon(setup.name)

    const {
        $name,
        $date,
        $frog
    } = toIons(setup, { address: false })

    const $address = toIonized(setup.address);

    const $street = ion.from($address, 'street')







    // const {
    //     name,
    //     date,
    //     address,
    //     frog
    // } = normalizeProps(setup, {
    //     name: n => n ?? 'sir robin'
    // }).all(toIon)

    // const {
    //     name,
    //     date,
    //     address,
    //     frog
    // } = normalizeProps(setup, { all: toIon })

    // const { name } = setup;

    // const _name = name ?? 'sir robin'

    return Component(
        <div>hi</div>
    )
}

export function TestCleanupSchedulerJS(setup = $setup({
    name: MaybeIon('?', String),
    nameB: Ion(String, Number, undefined), // {nameB: Ion<string | number | undefined>} 
    nameC: MaybeIon('?', String, Number), // {nameB: Ion<string | number> | undefined}
    date: Date,
    $frog: Ionized({
        name: Type(String, Number),
        setName: I('name', String).O(String),
        doSomething: I('node', String, Rest(Any)).O(String),
        qualities: [String, Number],
        well: Tup(String, String)
    })
})) {

    setup.name = setup.name ?? 'hi'

    const { $name, $nameB, $nameC, date } = normalizeIonicProps(setup)

}

export function TestCleanupSchedulerTS(setup = $setup({
    name: MaybeIon<'?' | string>,
    nameB: Ion<string | number | undefined>, // {nameB: Ion<string | number | undefined>} 
    nameC: MaybeIon<'?' | string | number>, // {nameB: Ion<string | number> | undefined}
    date: Type<Date>,
    $frog: Ionized<{
        name: string,
        setName: (name: string) => string
    }>,
    emitIncrementClicked: Type<() => void>
})) {

    setup.name = setup.name ?? 'hi'

    const { $name, $nameB, $nameC, date } = normalizeIonicProps(setup, {
        name: toIon,
        nameC: toIon,
        $frog: toIonized
    })

}

export function TestCleanupScheduler({
    name,
    $nameB,
    date,
    dateB,
    address,
} = $setup({
    name: [type<string>, n => n ?? 'hi', toIon],
    nameB: [type<string | number | undefined>, toIon], // {nameB: Ion<string | number | undefined>} 
    nameC: [type<'?' | string | number>, toIon], // {nameB: Ion<string | number> | undefined}
    date: [type<Date>],
    $frog: [type<{
        name: string,
        setName: (name: string) => string
    }>, isIonized]
}, { all: toIon })) {

    const $stopButton = NodeRef('button')

    const $frog = ionize({
        name: 'kermit'
    }, {
        setName(name: string) {
            $frog.name = name
        }
    })

    //@ts-expect-error
    const $frogName = asPropIon($frog, 'name', {
        $$set: $frog.setName
    })

    const $count = ion(0, {
        setTo(value: number) {
            if (value > 100) return value;
            $count.as(value);
        },
        set(value: number) {
            $count.as(value)
        }
    })

    // function reInputChange(event: InputEvent) {
    //     $frog.setName((event.target as HTMLInputElement).value)
    // }

    function initWatcher() {
        watch($frog, () => {
            console.log('frog changed name', $frog.name)
        }, { until: [$stopButton()!, 'click'] })
    }


    // simple one-to-one class to state binding
    classify($div, div =>
        [
            'active latent',
            ['dragging', $isDragging() && $falling()],
            ['highlight', $isHighlight()],
            [$dragging(), {
                add: 'dragging',
                remove: ['highlight', 'grow']
            }]
        ]
    )

    // compiles to
    classify($div, [
        'active latent',
        ['dragging', () => $isDragging() && $falling()],
        ['highlight', $isHighlight],
        [$isDragging, {
            add: 'dragging',
            remove: ['highlight', 'grow']
        }]
    ])

    // binding state to class list manipulation


    // simple style bindings
    style($div, div =>
        [{
            backgroundColor: $mainColor,
            width: `${$listItem.width + 1} px`,
            height: `${$height()} px`
        },
        $dragging() ? (
            div.backgroundColor = 'gray',
            div.width = `${listItem$.width} px`,
            div.height = `${$height()} px`
        ) : (
            div.backgroundColor = 'red',
            div.width = `0 px`
        )]
    )

    // styles that depend on state



    style($item, (o, item, index) =>
        $dragging() ? (
            o.backgroundColor = 'gray',
            o.width = `${listItem$.width} px`,
            o.height = `${$height()} px`
        ) : (
            o.backgroundColor = 'red',
            o.width = `0 px`
        )
    )



    return Component(
        () =>
            <>
                <textarea>{{ $: $frogName }}</textarea>

                <input $value={i0, $frogName} />

                <div>{$frog.name}</div>
                <div>{$frogName() + '!'} </div>

                <div>{$frogName}</div>

                <div>{i0, $frogName()} </div>
                <div>{i0, $frogName() + '!'} </div>

                <input $value={$frogName} />

                <input $value={i0, $frogName() + '!'} />

                <input $value={$frogName} />

                <button ref={$stopButton}>stop</button>
                <button on:click={initWatcher}>start</button>
                <div
                    width={2}
                    style={'width: 2px', {
                        lineHeight: 1.5, // only declare layout css in the template that depends on hierarchy
                        background: $divBgColor,
                        border: '2px solid #e66465',
                        [text_color]: 'red',
                        [background_image]: $image
                    }}  // use ions for dynamic styles restricted to an element
                >
                    <p style={{
                        margin: '15px',
                        lineHeight: '1.5',
                        textAlign: 'center',
                        color: text_color
                    }}>
                        Well, I am the slime from your video<br />
                        Oozin' along on your livin' room floor.
                    </p>
                    <ChildBlock></ChildBlock>
                </div>
            </>
    )
}

function ChildBlock() {



    return Component(
        <div style color={text_color}></div>
    )
}

// shared variables
const text_color = '--text-color'
const background_image = '--background-color'

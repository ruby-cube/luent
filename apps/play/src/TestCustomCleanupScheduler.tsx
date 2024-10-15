//@ts-nocheck
import { Component, NodeRef, watch } from "@rue/lumo"
import { DerivedIon, ion, ionize, watchIonicEffect, } from "@rue/quarky"
import { asPropIon } from "../../../packages/quarky/src/ionize/PropIon"

export function TestCleanupScheduler() {
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
        $$set(value: number) {
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
    classify($div, [
        [$highlightState], // returns a class 
        [$isDragging, 'dragging'],
        [$isHighlighted, 'highlight'],
        [$dragging, 'dragging'],
        [() => !$dragging(), 'highlight', 'grow'],
        div => {
            if ($dragging()) {
                div.add('dragging');
                div.remove(['highlight', 'grow'])
            }
            else { 
                div.add(['highlight', 'grow']) 
                div.remove('dragging')
            }
        }
    ])

    // binding state to class list manipulation


    // simple style bindings
    style($div, [{
        backgroundColor: $mainColor(),
        width: `${listItem$.width + 1} px`,
        height: `${$height()} px`
    }, div => {
        if ($dragging()) {
            div.backgroundColor = 'gray';
            div.width = `${listItem$.width} px`;
            div.height = `${$height()} px`;
        } else {
            div.backgroundColor = 'red';
            div.width = `0 px`;
        }
    }])
    // styles that depend on state



    style($item, (item, index) =>
        node => {
            if ($dragging()) {
                node.backgroundColor = 'gray';
                node.width = `${listItem$.width} px`;
                node.height = `${$height()} px`;
            } else {
                node.backgroundColor = 'red';
                node.width = `0 px`;
            }
        })

    const itemIfDragging = defineStyle(
        (item, index) =>
            o => {
                if ($dragging()) {
                    o.backgroundColor = 'gray';
                    o.width = `${listItem$.width} px`;
                    o.height = `${$height()} px`;
                } else {
                    o.backgroundColor = 'red';
                    o.width = `0 px`;
                }
            })


    return Component(
        () =>
            <>
                <textarea>{{ $: $frogName }}</textarea>
                <input $value={$frogName} />
                <button ref={$stopButton}>stop</button>
                <button onclick={initWatcher}>start</button>
                <div
                    width={2}
                    style={['width: 2px', divIfActive, {
                        lineHeight: 1.5, // only declare layout css in the template that depends on hierarchy
                        background: $divBgColor,
                        border: '2px solid #e66465',
                        [text_color]: 'red',
                        [background_image]: $image
                    }]}  // use ions for dynamic styles restricted to an element
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

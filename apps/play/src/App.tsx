import { useReactivity } from "@rue/muonic"

const { $, set } = useReactivity();

export function App() {

    return (
        <>
            <div>hei</div>
            <BlockDOM dog="hi"></BlockDOM>
        </>
    )
}

function BlockDOM(props: { dog: string }) {
    const $stuff = $("hi")
    const $other = $("ho")

    return (
        <div>
            <p>
                {props.dog}
            </p>
            <p>
                {$stuff() + $other()}
            </p>
        </div>
    )
}   
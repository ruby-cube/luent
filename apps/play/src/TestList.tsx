import { component, $for } from "@rue/lumo";
import { ionize } from "@rue/quarky";

export function PlainList() {
    const $list = ionize([
        { name: 'apples' },
        { name: 'peaches' },
        { name: 'pear' },
        { name: 'plums' },
    ])

    return component(
        <>
            {$for($list, ($item, $index) =>
                <p>{()=>$item.name}</p>
            )}
        </>
    )
}
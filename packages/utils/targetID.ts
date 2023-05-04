// targetID = prefixes + id + index
export function genTargetID(config: {
    id?: string,
    prefixes?: string[],
    index?: number
}) {
    const { index, id, prefixes } = config;
    let targetID = "";
    if (prefixes) {
        for (const prefix of prefixes) {
            targetID = targetID + "-" + prefix;
        }
    }
    if (id) {
        targetID = targetID + "_" + id;
    }
    if (index) {
        targetID = targetID + "_" + index;
    }
    return targetID;
}
let hydrating = false;

export function startHydration(){
    hydrating = true;
}

export function isHydrating() {
    return hydrating;
}

export function endHydration(){
    hydrating = false;
}
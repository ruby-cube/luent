import { component, mount, css, template } from "@rue/luent";
import "./TestStyleOverride-classes.css"
import { AnyObject } from "@rue/types";

// transpiler
let id = 0;
function genOverrideClass() {
    return 'ovrrd' + id++
}

function Grandparent() {
    return (

        <div class='lessons'>
            <Parent class="blue-card something-else"></Parent>
        </div>
        // <Parent class='blue-card' overrideClass='ovrrd0'></Parent> // transpiler
    );
}



function Parent() {
    return (

        <Child class="dark-card"></Child>
        // <Child class='dark-card' overrideClass='ovrrd1'></Child> // transpiler
    );
}

const overrideStack: string[] = []

function pushOverride(override: string) {
    overrideStack.push(override)
}

function popOverride() {
    overrideStack.pop()
}

function getOverrideStack() {
    return overrideStack
}





function Child() {
    return (

        <div class='card ovrrd1 ovrrd0 blue-card dark-card'>
            hello world
        </div>
    )
        .style(css`
        ${getTailwindClassDeclaration('blue-card', ['ovrrd0', 'ovrrd1'])}
        ${getTailwindClassDeclaration('dark-card', ['ovrrd1'])}
    `);
}

if (__STYLE__) mount(Grandparent, "#root");

function getTailwindClassDeclaration(className: string, specifiers: string[]) {
    const selector = generateSelector(className, specifiers)
    let newRules = ""
    const stylesheets = document.styleSheets
    for (const sheet of stylesheets) {
        console.log('SHEET', sheet)
        const rules = sheet.cssRules
        for (const rule of rules) {
            if (rule instanceof CSSLayerBlockRule) {
                const cssRules = rule.cssRules
                for (const rule of cssRules) {
                    if (hasClass(rule, className)) {
                        newRules += withSelector(rule.cssText, className, selector)
                    }
                }
            }
            else if (hasClass(rule, className)) {
                newRules += withSelector(rule.cssText, className, selector)
            }
        }
    }
    return newRules;
}

function generateSelector(className: string, specifiers: string[]) {
    return specifiers.reduce((prev, current) => (current + '.' + prev), className)
}

function withSelector(rule: string, className: string, selector: string) {
    return rule.replace(new RegExp(`\\b${className}\\b`, 'g'), selector)
}

function hasClass(rule: AnyObject, className: string) {
    return rule.selectorText && rule.selectorText.indexOf(className) !== -1
}
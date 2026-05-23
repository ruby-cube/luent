import { component, createRoot, css, Style, template } from "@rue/luent";
import "./TestStyleOverride-classes.css"
import { AnyObject } from "@rue/types";

function Grandparent() {
    return component(
        <div class='lessons'>
            <Parent class="bg-blue-600"></Parent>
        </div>
        // <Parent class='override0 bg-blue-600'></Parent> // transpiler
    );
}

function Parent() {
    return component(
        <Child class="bg-amber-900"></Child>
        // <Child class='override1 bg-amber-900'></Child> // transpiler
    );
}

function Child() {
    return component(
      <>
        <div class='bg-amber-400 override1 override0 bg-blue-600 bg-amber-900'>
            hello world
        </div>
        {Style(css`
           ${getTailwindClassDeclaration('bg-blue-600', ['override0', 'override1'])}
           ${getTailwindClassDeclaration('bg-amber-900', ['override1'])}
        `)}
      </>
    )
}

if (__STYLE__) createRoot(() => <Grandparent></Grandparent>).mount("#root");


function getTailwindClassDeclaration(className: string, specifiers: string[]) {
    const selector = generateSelector(className, specifiers)
    let newRules = ""
    const stylesheets = document.styleSheets
    for (const sheet of stylesheets) {
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
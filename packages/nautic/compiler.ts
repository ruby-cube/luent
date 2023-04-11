import { walk } from "estree-walker";
import { parse } from "@babel/parser";
const generate = require("@babel/generator").default;

function createFrogObject() {
  return { sir: 'robin', handler: (context, event) => { doSomething(); } };
}

const frog = createFrogObject();
const objLiteral = "const map = " + JSON.stringify(frog, (key, value) => {
  if (typeof value === 'function') {
    return "$Function"
  }
  return value;
}, 2)
  .replace(/"([^"]+)":/g, '$1:')
  // .replace(/"([^"]+)"/g, (match, p1) => {
  //   if (/function/.test(p1)) {
  //     return p1;
  //   }
  //   return `"${p1}"`;
  // });

  function doSomething(){
    const lalalal = "snow"
    lalalal;
    walk()
  }

  console.log(objLiteral);
  const astObj = parse(objLiteral);
  const astFunc = parse(`${frog.handler}`)
  console.log(astFunc)

  walk(astObj, {
    enter(node){
      if (node.type === "StringLiteral" && node.value === "$Function"){
        const func = astFunc.program.body[0]
        this.replace({
          type: "ArrowFunctionExpression",
          params: func.params,
          body: func.body
        })
      }
    }
  })

  console.log(generate(astObj).code)

  // const eh = {
  //   sir: "robin",
  //   handler: function handler(context, event) {     doSomething();    }
  // } 
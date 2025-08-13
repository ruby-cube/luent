import { __DEV__checkIfTracked, Ion } from "@rue/quarky";
import { Booleanny } from "@rue/types";
import { MaybeIon } from "../component/Input";

interface ConditionalKit {
   statementType: "if" | "elseIf" | "else";
   $condition: MaybeIon<Booleanny>
}

export class ConditionalSeries {
   conditions: Ion<Booleanny>[] = [];
   prevActiveIndex?: number = undefined;
   activeIndex!: number;
   statements: (ConditionalKit | undefined)[]

   constructor(
      statements: ConditionalKit[],
      makeElseKit?: () => ConditionalKit
   ) {
      this.statements = statements;
      for (let i = 0; i < statements.length; i++) {
         const kit = statements[i]
         const $condition = kit.$condition
         if ($condition) {
            this.conditions.push($condition)
         }
         if (i === 0 && kit.statementType !== 'if' || i !== 0 && kit.statementType === 'if') {
            if (__DEV__) throw new Error('If must be the first child of a conditional series (or extraneous use of fragment/array)')
            else continue;
         }
         if (!('statementType' in kit)) {
            if (__DEV__) throw new Error("Conditional series can only contain conditional statements created by the If, ElseIf, and Else functions")
            else continue;
         }
         if (i !== statements.length - 1 && kit.statementType === 'else') {
            if (__DEV__) throw new Error("Else must be the very last statement of a conditional series");
            else continue;
         }
      }
      if (noElseBlock(statements)) {
         this.addKit(makeElseKit?.())
      }
   }

   addKit(kit: ConditionalKit | undefined) {
      this.statements.push(kit);
   }

   $ActiveIndex() {
      return () => {
         const conditions = this.conditions
         for (let i = 0; i < conditions.length; i++) {
            const $condition = conditions[i]
            if ($condition()) {
               this.prevActiveIndex = this.activeIndex;
               this.activeIndex = i;
               return i;
            }
         }
         this.prevActiveIndex = this.activeIndex;
         this.activeIndex = conditions.length;
         return conditions.length;
      }
   }

   // getConditionsIon() {
   //    const conditions = this.conditions
   //    return () => {
   //       const values: boolean[] = [];
   //       for (const $condition of conditions) {
   //          values.push(Boolean($condition()));
   //       }
   //       return values;
   //    } // $(() => [$conditionA(), $conditionB(), ...])
   // } // must retrack in case any of its conditions require retracking
}


function noElseBlock(statements: ConditionalKit[]) {
   if (statements.length === 0) throw new Error(`Conditional series is empty`)
   if (statements.at(-1)!.statementType !== 'else') return true;
   return false;
}

// export function validateStandAloneConditional(conditionalKit: ConditionalKit, series: any[], index: number) {
//     if (conditionalKit.statementType !== 'if')
//         throw new Error(`$${conditionalKit.statementType} conditional must be contained in a fragment or array that begins with If`)
//     const nextEntity = series[index + 1];
//     if (nextEntity instanceof ConditionalKit && nextEntity.statementType !== 'if')
//         throw new Error(`A series of conditional statements must be enclosed in a fragment or array`)
// }
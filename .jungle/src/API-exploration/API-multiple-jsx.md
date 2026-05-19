```tsx
function If(...arg: any[]){}
function ElseIf(...arg: any[]){}
function Else(...arg: any[]){}

function TestA() {
   <div>
      {If(active)} <>
         <div></div>
         <div></div>
      </>
      {ElseIf(active)} <>
         <div></div>
         <div></div>
      </>
      {Else} <>
         <div></div>
         <div></div>
      </>
   </div>
}

function TestB() {
   <div>
      {If(active,
         <div>
            something
         </div>
         <div>
            else
         </div>
      )}
      {ElseIf(active,
         <div>
            something
         </div>
         <div>
            else
         </div>
      )}
      {Else(
         <div>
            something
         </div>
         <div>
            else
         </div>
      )}
   </div>
}

```
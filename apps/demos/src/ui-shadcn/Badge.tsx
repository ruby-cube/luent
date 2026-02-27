import { FromTag, TagName, TagType, template } from "@rue/lumo"
import { type VariantProps } from "class-variance-authority"
import { defineVariants, mergeTailwind } from "../utils/utils"

const badgeVariants = defineVariants(
   "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge",
   {
      variants: {
         variant: {
            default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
            secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
            destructive: "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
            outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
            ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
            link: "text-primary underline-offset-4 hover:underline",
         },
      },
      defaultVariants: {
         variant: "default",
      },
   }
)

type BadgeInput = VariantProps<typeof badgeVariants> & {
   as?: TagType
}

function Badge({
   $classes,
   variant = "default",
   as: Comp = 'span', // replaces useRender; TODO: does it cover use case below?
   ...attributes
}: FromTag<'span', BadgeInput>) {

   return template(
      <Comp
         class={(mergeTailwind(badgeVariants({ variant }), $classes()))}
         {...attributes}
      ></Comp>
   )
}

export { Badge, badgeVariants }



// function Counter(props: CounterProps) {
//   const { render, ...otherProps } = props;

//   const [count, setCount] = React.useState(0);
//   const odd = count % 2 === 1;
//   const state = React.useMemo(() => ({ odd }), [odd]);

//   const defaultProps: useRender.ElementProps<'button'> = {
//     className: styles.Button,
//     type: 'button',
//     children: (
//       <React.Fragment>
//         Counter: <span>{count}</span>
//       </React.Fragment>
//     ),
//     onClick() {
//       setCount((prev) => prev + 1);
//     },
//     'aria-label': `Count is ${count}, click to increase.`,
//   };

//   const element = useRender({
//     defaultTagName: 'button',
//     render,
//     state,
//     props: mergeProps<'button'>(defaultProps, otherProps),
//   });

//   return element;
// }

// export default function ExampleCounter() {
//   return (
//     <Counter
//       render={(props, state) => (
//         <button {...props}>
//           {props.children}
//           <span className={styles.suffix}>{state.odd ? '👎' : '👍'}</span>
//         </button>
//       )}
//     />
//   );
// }
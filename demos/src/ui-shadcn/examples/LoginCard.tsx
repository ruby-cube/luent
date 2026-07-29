import { mountIsland } from "luent"
import { Button } from "../Button"
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "../Card"
import { Input } from "../Input"
import { Label } from "../Label"

export function CardDemo() {
   return (
      <Card class="w-full max-w-sm">
         <CardHeader>
            <CardTitle>Log in to your account</CardTitle>
            <CardDescription>
               Enter your email below to login to your account
            </CardDescription>
            <CardAction>
               <Button variant="link">Sign up</Button>
            </CardAction>
         </CardHeader>
         <CardContent>
            <form>
               <div class="flex flex-col gap-6">
                  <div class="grid gap-2">
                     <Label for="email">Email</Label>
                     <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                     />
                  </div>
                  <div class="grid gap-2">
                     <div class="flex items-center">
                        <Label for="password">Password</Label>
                        <a
                           href="#"
                           class="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                        >
                           Forgot your password?
                        </a>
                     </div>
                     <Input id="password" type="password" required />
                  </div>
               </div>
            </form>
         </CardContent>
         <CardFooter class="flex-col gap-2">
            <Button type="submit" microclass="w-full">
               Log in
            </Button>
            <Button variant="outline" microclass="w-full">
               Log in with Google
            </Button>
         </CardFooter>
      </Card>
   )
}

if (__STYLE__) {
   mountIsland(CardDemo, '#root')
}
import { mountIsland } from "@rue/luent"
import { Badge } from "../Badge"
import { Button } from "../Button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../Card"

export function ImageCard() {
  return (
    <Card microclass="relative mx-auto w-full max-w-sm pt-0">
      <div microclass="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src="https://avatar.vercel.sh/shadcn1"
        alt="Event cover"
        microclass="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardAction>
          <Badge variant="secondary">Featured</Badge>
        </CardAction>
        <CardTitle>Design systems meetup</CardTitle>
        <CardDescription>
          A practical talk on component APIs, accessibility, and shipping
          faster.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button microclass="w-full">View Event</Button>
      </CardFooter>
    </Card>
  )
}

if (__STYLE__) {
   mountIsland(ImageCard, '#root')
}
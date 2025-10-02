import { atUnmount, component } from "@rue/lumo";
import { queueIonicTask, Ion, Ionized, SYNC, watch } from "@rue/quarky";

export function DateApp() {

   const date = Ionized(new Date())

   const format = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
   }).format;

   const interval = setInterval(() => {
      date.setTime(Date.now());
   }, 1000);

   atUnmount(() => clearInterval(interval))

   return component(
      <p>The time is {(format(date))}</p>
   )
}

{/* <script>
	import { SvelteDate } from 'svelte/reactivity';

	const date = new SvelteDate();

	const formatter = new Intl.DateTimeFormat(undefined, {
	  hour: 'numeric',
	  minute: 'numeric',
	  second: 'numeric'
	});

	$effect(() => {
		const interval = setInterval(() => {
			date.setTime(Date.now());
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});

</script>

<p>The time is {formatter.format(date)}</p> */}




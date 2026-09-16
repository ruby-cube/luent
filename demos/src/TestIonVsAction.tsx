import { FromTag, Ion } from "luent";

function TestIonInput(setup: FromTag<{
  count: Ion<number>;
  isNegative: () => boolean;
}>) {
  const { $count, isNegative } = setup

  return <>

  </>
}

<TestIonInput
  count={'hi'}
  isNegative={() => true}
/>

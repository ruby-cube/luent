import { css, For, ionic, Style, type FromTag } from "luent"

export function EmojiCollection(setup: FromTag<{
  limit: number;
  getEmoji: () => string
}>) {
  const { limit, getEmoji } = setup;

  const emojis = ionic(['🍀', '🍄', '✨'])

  return <>
    <ul class='emoji-collection'>
      {For(emojis, emoji =>
        <EmojiChip>{emoji}</EmojiChip>
      )}
    </ul>
    <button
      class='add-emoji'
      disabled={() => emojis.length === limit}
      on:click={() => emojis.push(getEmoji())}
    >
      +
    </button>

    {Style(css`
      .emoji-collection {
        display: flex;  
        flex-wrap: wrap;
        align-content: flex-start;
        gap: .5rem;
        list-style: none;
      }
    `)}
  </>
}

function EmojiChip(setup: FromTag<{ Slot: () => string }>) {
  const { Slot } = setup;

  return <>
    <li class='emoji-chip'><Slot/></li>

    {Style(css`
      .emoji-chip {
        width: 2rem;
        height: 2rem;
        display: grid;
        place-items: center;
        border-radius: .4rem;
        border: 2px solid #d4af37;
        background: linear-gradient(135deg, #3d2817 0%, #2d1b4e 100%);
        font-size: 1.1rem;
        box-shadow: 0 0 8px rgba(212, 175, 55, .3);
      }
    `)}
  </>
}
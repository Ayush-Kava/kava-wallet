const APPLE_EMOJI_CDN =
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.1/img/apple/64';

/** Convert emoji grapheme to emoji-datasource unified code (e.g. "1f6d2"). */
export function emojiToUnified(emoji: string): string {
  return Array.from(emoji.trim())
    .map(char => char.codePointAt(0)!.toString(16))
    .join('-');
}

export function getAppleEmojiUrl(emoji: string): string {
  return `${APPLE_EMOJI_CDN}/${emojiToUnified(emoji)}.png`;
}

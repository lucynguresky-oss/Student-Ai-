/** Pull @usernames out of text, normalised (lowercase), deduped, no leading @. */
export function extractMentions(text: string): string[] {
  // the @ must not be preceded by a username char, so emails like
  // "john@example.com" don't get parsed as a mention of "example".
  const matches = text.match(/(?<![A-Za-z0-9._])@([a-zA-Z0-9._]+)/g) ?? [];
  return [
    ...new Set(
      matches
        .map((m) => m.replace(/^@/, '').toLowerCase().replace(/[._]+$/, ''))
        .filter((u) => u.length >= 3),
    ),
  ];
}

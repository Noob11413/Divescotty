/** Parse `End time: HH:MM` embedded in special_requests (admin + calendar convention). */
export function parseEndTimeFromSpecialRequests(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(
    /(?:^|\|)\s*End time:\s*([0-2]\d:[0-5]\d(?:[:][0-5]\d)?)\s*(?:\||$)/i,
  );
  return match?.[1] ?? null;
}

/**
 * Appends suggestion text to a draft.
 * - Predictive continuations typically already include leading space → padSpace false
 * - Smart replies are full phrases → padSpace true when draft has content
 */
export function appendToDraft(input: {
  text: string;
  suggestion: string;
  padSpace?: boolean;
}): { nextText: string; nextCaret: number } {
  const suggestion = input.padSpace
    ? input.suggestion.replace(/\s+/g, " ").trim()
    : input.suggestion;

  if (!suggestion) {
    return {
      nextText: input.text,
      nextCaret: input.text.length,
    };
  }

  const draft = input.text;
  if (!input.padSpace) {
    const nextText = `${draft}${suggestion}`;
    return {
      nextText,
      nextCaret: nextText.length,
    };
  }

  if (!draft.trim()) {
    return {
      nextText: suggestion,
      nextCaret: suggestion.length,
    };
  }

  const needsSpace = !/\s$/.test(draft);
  const nextText = needsSpace ? `${draft} ${suggestion}` : `${draft}${suggestion}`;
  return {
    nextText,
    nextCaret: nextText.length,
  };
}

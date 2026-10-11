export type TextSegment = { type: 'text'; value: string } | { type: 'link'; value: string }

const URL_PATTERN = /https?:\/\/[^\s<>"]+/g
/** Punctuation that usually ends a sentence rather than belonging to the URL. */
const TRAILING_PUNCTUATION = /[.,;:!?)\]'"]+$/

/** Splits plain text into text and http(s) link segments, for rendering clickable URLs in notes. */
export function linkify(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let last = 0
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING_PUNCTUATION, '')
    const start = match.index
    if (start > last) segments.push({ type: 'text', value: text.slice(last, start) })
    segments.push({ type: 'link', value: url })
    last = start + url.length
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) })
  return segments
}

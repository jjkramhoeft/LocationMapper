import { linkify } from '../domain/linkify'

/** Plain-text note with line breaks kept and URLs clickable. */
export function Note({ text, className }: { text: string; className?: string }) {
  return (
    <p className={className ? `note ${className}` : 'note'}>
      {linkify(text).map((segment, i) =>
        segment.type === 'link' ? (
          <a key={i} href={segment.value} target="_blank" rel="noopener noreferrer">
            {segment.value}
          </a>
        ) : (
          segment.value
        ),
      )}
    </p>
  )
}

import { describe, expect, it } from 'vitest'
import { linkify } from './linkify'

describe('linkify', () => {
  it('returns plain text untouched', () => {
    expect(linkify('no links here')).toEqual([{ type: 'text', value: 'no links here' }])
    expect(linkify('')).toEqual([])
  })

  it('splits out http and https links', () => {
    expect(linkify('See https://example.com/a?b=1 and http://x.dk')).toEqual([
      { type: 'text', value: 'See ' },
      { type: 'link', value: 'https://example.com/a?b=1' },
      { type: 'text', value: ' and ' },
      { type: 'link', value: 'http://x.dk' },
    ])
  })

  it('leaves trailing sentence punctuation out of the link', () => {
    expect(linkify('(see https://example.com).')).toEqual([
      { type: 'text', value: '(see ' },
      { type: 'link', value: 'https://example.com' },
      { type: 'text', value: ').' },
    ])
  })

  it('ignores non-http schemes', () => {
    expect(linkify('javascript:alert(1)')).toEqual([{ type: 'text', value: 'javascript:alert(1)' }])
  })
})

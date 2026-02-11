import { describe, expect, it } from 'vitest'
import { extractSubjectFromHtml, htmlToMarkdown } from './parser'

describe('parser service', () => {
  it('converts html structure to markdown and keeps links/lists', () => {
    const html = `
      <html>
        <head>
          <title>Weekly Digest</title>
          <style>body { color: red; }</style>
          <script>console.log('tracking')</script>
        </head>
        <body>
          <h1>Top Pain Points</h1>
          <p>See the <a href="https://example.com/report">full report</a>.</p>
          <ul>
            <li>Slow onboarding</li>
            <li>Too many integrations</li>
          </ul>
          <img src="https://tracker.example/pixel.gif" alt="tracking pixel">
          <p>Final note.</p>
        </body>
      </html>
    `

    const markdown = htmlToMarkdown(html)

    expect(markdown).toContain('# Top Pain Points')
    expect(markdown).toContain('[full report](https://example.com/report)')
    expect(markdown).toContain('- Slow onboarding')
    expect(markdown).toContain('- Too many integrations')
    expect(markdown).toContain('Final note.')
    expect(markdown).not.toContain('tracking pixel')
    expect(markdown).not.toContain('<img')
    expect(markdown).not.toContain('console.log')
    expect(markdown).not.toContain('color: red')
  })

  it('normalizes excessive blank lines', () => {
    const markdown = htmlToMarkdown('<p>One</p><p>Two</p><p>Three</p>')
    expect(markdown).not.toMatch(/\n{3,}/)
  })

  it('returns empty markdown when html is empty', () => {
    expect(htmlToMarkdown('')).toBe('')
    expect(htmlToMarkdown('   ')).toBe('')
  })

  it('extracts subject from html title', () => {
    const html = '<html><head><title>Market Signals</title></head><body>Body</body></html>'
    expect(extractSubjectFromHtml(html)).toBe('Market Signals')
  })
})

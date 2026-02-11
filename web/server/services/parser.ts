import * as cheerio from 'cheerio'
import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

turndown.addRule('removeImages', {
  filter: ['img', 'picture', 'source'],
  replacement: () => '',
})

export function htmlToMarkdown(html: string): string {
  if (!html?.trim()) return ''

  const $ = cheerio.load(html)
  $('script, style, noscript, template, svg').remove()
  $('img, picture, source').remove()

  const source = $('body').length ? ($('body').html() || '') : $.html()
  const markdown = turndown.turndown(source)
  return markdown
    .replace(/^- {2,}/gm, '- ')
    .replace(/^(\d+\.) {2,}/gm, '$1 ')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function extractSubjectFromHtml(html: string): string {
  const $ = cheerio.load(html)
  return $('title').text().trim()
}

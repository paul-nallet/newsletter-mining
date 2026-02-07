import * as cheerio from 'cheerio'

export function parseHtml(html: string): string {
  const $ = cheerio.load(html)
  $('script, style').remove()
  return $.text().replace(/\s+/g, ' ').trim()
}

export function extractSubjectFromHtml(html: string): string {
  const $ = cheerio.load(html)
  return $('title').text().trim()
}

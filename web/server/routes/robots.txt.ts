import { defineEventHandler, getRequestURL, setHeader } from 'h3'

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)
  const baseUrl = requestUrl.origin

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap.xml', baseUrl).toString()}`,
  ].join('\n')

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return body
})

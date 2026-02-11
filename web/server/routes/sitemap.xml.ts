import { defineEventHandler, getRequestURL, setHeader } from 'h3'

const STATIC_ROUTES = [
  '/',
  '/for-indie-hackers',
  '/for-vcs',
  '/for-product-managers',
  '/for-consultants',
  '/login',
  '/register',
] as const

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)
  const baseUrl = requestUrl.origin
  const lastmod = new Date().toISOString().slice(0, 10)

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    STATIC_ROUTES.map((route) => {
      const loc = escapeXml(new URL(route, baseUrl).toString())
      return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
    }).join('\n') +
    '\n</urlset>'

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return body
})

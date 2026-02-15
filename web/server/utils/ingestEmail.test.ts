import { afterEach, describe, expect, it } from 'vitest'
import { extractEmailAddress, generateIngestEmail, normalizeEmailAddress } from './ingestEmail'

const originalIngestDomain = process.env.INGEST_EMAIL_DOMAIN
const originalNuxtIngestDomain = process.env.NUXT_INGEST_EMAIL_DOMAIN

afterEach(() => {
  if (originalIngestDomain === undefined) delete process.env.INGEST_EMAIL_DOMAIN
  else process.env.INGEST_EMAIL_DOMAIN = originalIngestDomain

  if (originalNuxtIngestDomain === undefined) delete process.env.NUXT_INGEST_EMAIL_DOMAIN
  else process.env.NUXT_INGEST_EMAIL_DOMAIN = originalNuxtIngestDomain
})

describe('ingestEmail utils', () => {
  it('extracts and normalizes addresses from display-name format', () => {
    expect(extractEmailAddress('Jane Doe <Jane.Doe+test@Example.COM>')).toBe('jane.doe+test@example.com')
  })

  it('extracts first valid address from multiple recipients', () => {
    const value = 'Bad Value, Team <hello@example.com>; second@example.org'
    expect(normalizeEmailAddress(value)).toBe('hello@example.com')
  })

  it('uses configurable ingest domain', () => {
    process.env.INGEST_EMAIL_DOMAIN = 'Mail.Inbox.Example'
    const email = generateIngestEmail()
    expect(email).toMatch(/^nl-[a-f0-9]{8}@mail\.inbox\.example$/)
  })
})

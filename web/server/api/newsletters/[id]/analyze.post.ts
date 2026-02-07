import { analyzeNewsletterById } from '../../../utils/analyze'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  try {
    const result = await analyzeNewsletterById(id)
    return { newsletterId: id, ...result }
  }
  catch (err: any) {
    if (err.message?.includes('not found')) {
      throw createError({ statusCode: 404, statusMessage: err.message })
    }
    throw err
  }
})

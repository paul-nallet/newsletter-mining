import { createWaitlistChallenge, getWaitlistSecret } from '../../services/waitlist'

export default defineEventHandler((event) => {
  const secret = getWaitlistSecret()
  return createWaitlistChallenge(event, secret)
})

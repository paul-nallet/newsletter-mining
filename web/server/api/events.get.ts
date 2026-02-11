import { onAppEvent } from '../utils/eventBus'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const stream = createEventStream(event)

  const unsubscribe = onAppEvent(async (appEvent) => {
    await stream.push({
      event: appEvent.type,
      data: JSON.stringify(appEvent.data),
    })
  })

  stream.onClosed(() => {
    unsubscribe()
  })

  return stream.send()
})

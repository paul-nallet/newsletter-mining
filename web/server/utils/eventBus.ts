import { EventEmitter } from 'node:events'

export interface AppEventMap {
  'newsletter:uploaded': { id: string; subject: string }
  'newsletter:analyzed': { id: string; problemCount: number }
  'clusters:updated': { totalClusters: number; totalProblems: number }
  'analyze-all:progress': { current: number; total: number; failed: number; skippedDueToCredits?: number }
  'analyze-all:done': { analyzed: number; failed: number; total: number; skippedDueToCredits?: number }
  'credits:updated': {
    limit: number
    periodStart: string
    consumed: number
    reserved: number
    remaining: number
    exhausted: boolean
  }
}

const emitter = new EventEmitter()
emitter.setMaxListeners(50)

export function emitAppEvent<K extends keyof AppEventMap>(type: K, data: AppEventMap[K]) {
  emitter.emit('app:event', { type, data })
}

export function onAppEvent(handler: (event: { type: string; data: unknown }) => void): () => void {
  emitter.on('app:event', handler)
  return () => emitter.off('app:event', handler)
}

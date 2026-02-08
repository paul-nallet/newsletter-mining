import { usePgClient } from '~~/server/database/client'

export default defineEventHandler(async () => {
  try {
    const db = usePgClient()
    const rows = await db<{ count: number }[]>`select count(*)::int as count from "user"`
    const existingUsers = rows[0]?.count ?? 0
    return { isOpen: existingUsers === 0 }
  }
  catch (error: any) {
    // If auth tables are not created yet, keep signup open to allow bootstrap.
    if (error?.code === '42P01') {
      return { isOpen: true }
    }
    throw error
  }
})

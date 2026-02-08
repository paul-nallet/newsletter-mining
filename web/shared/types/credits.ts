export type CreditStatus = {
  limit: number
  periodStart: string
  consumed: number
  reserved: number
  remaining: number
  exhausted: boolean
}

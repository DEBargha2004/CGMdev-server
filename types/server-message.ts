export type ServerMessage<T = null> = {
  status: 'success' | 'error'
  title: string
  description: string
  result?: T | null
}

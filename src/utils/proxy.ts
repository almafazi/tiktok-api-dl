import { ProxyAgent } from "undici"
import type { Dispatcher } from "undici"

// Creates an undici dispatcher for proxying fetch requests.
// Supports HTTP, HTTPS, and SOCKS proxies via undici's ProxyAgent.
export const createDispatcher = (proxy?: string): { dispatcher?: Dispatcher } => {
  if (!proxy) return {}
  return { dispatcher: new ProxyAgent(proxy) }
}

// client/src/lib/extractors.ts

export interface ParsedEvent {
  tool: string;
  tokens: number;
  timestamp: number;
  raw: any;
}

export function extractTokens(payload: any): number {
  if (!payload) return 0;
  
  if (typeof payload.totalTokens === 'number') return payload.totalTokens;
  if (typeof payload.total_tokens === 'number') return payload.total_tokens;
  
  if (typeof payload.prompt_tokens === 'number' && typeof payload.completion_tokens === 'number') {
    return payload.prompt_tokens + payload.completion_tokens;
  }
  
  if (typeof payload.input_tokens === 'number' && typeof payload.output_tokens === 'number') {
    return payload.input_tokens + payload.output_tokens;
  }
  
  if (payload.usage) {
    if (typeof payload.usage.total_tokens === 'number') return payload.usage.total_tokens;
    if (typeof payload.usage.prompt_tokens === 'number' && typeof payload.usage.completion_tokens === 'number') {
      return payload.usage.prompt_tokens + payload.usage.completion_tokens;
    }
  }
  
  return 0;
}

export function extractTool(payload: any): string {
  if (!payload) return "unknown";
  
  const id = payload.tool || payload.platform || payload.provider || payload.source;
  if (typeof id === 'string' && id.trim().length > 0) {
    return id.toLowerCase();
  }
  
  if (payload.url && typeof payload.url === 'string') {
    try {
      const hostname = new URL(payload.url).hostname;
      if (hostname.includes("openai")) return "chatgpt";
      if (hostname.includes("anthropic")) return "claude";
      if (hostname.includes("google")) return "gemini";
      return hostname;
    } catch {
      // ignore
    }
  }
  
  return "unknown";
}

export function extractTimestamp(payload: any): number {
  if (!payload) return Date.now();
  
  if (typeof payload.timestamp === 'number') return payload.timestamp;
  if (typeof payload.ts === 'number') return payload.ts;
  if (typeof payload.created === 'number') {
    // If it looks like seconds instead of ms
    return payload.created < 2000000000 ? payload.created * 1000 : payload.created;
  }
  
  return Date.now();
}

export function parseEvent(event: any): ParsedEvent {
  const payload = event?.payload || event || {};
  return {
    tool: extractTool(payload),
    tokens: extractTokens(payload),
    timestamp: extractTimestamp(payload),
    raw: event
  };
}

export function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

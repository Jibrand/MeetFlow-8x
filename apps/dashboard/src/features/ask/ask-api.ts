import { apiClient } from '../../lib/api-client';
export interface AskCitation { meetingId: string; meetingTitle: string; timestampSeconds?: number; quote?: string; speaker?: string }
export interface AskResponse { answer: string; citations: AskCitation[]; scope?: string }
export function queryAssistant(question: string, meetingId?: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<AskResponse> {
  return apiClient('/ask', { method: 'POST', body: JSON.stringify({ question, meetingId, history: history.slice(-10).map((message) => ({ ...message, content: message.content.slice(0, 5000) })) }), timeoutMs: 95_000 });
}

/** 
 * Common type for SSE messages
 * 
 * Origin: What service did this come from?
 * Version: What version of the API or endpoint pushed this?
 * Timestamp: When was the data recorded?
 * MessageType: What kind of payload is enclosed?
 * Payload: Should resolve based on messageType parameter -- actual contents
 */
export interface SSEMessage {
  origin: string;
  version: string;
  timestamp: number;
  messageType: string;
  payload: unknown;
}
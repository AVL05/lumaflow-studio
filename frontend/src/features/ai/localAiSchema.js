/**
 * Esquema versionado del historial local de IA (puero, sin JSX).
 *
 * Compartido por la app y la suite E2E para sembrar/leer la misma base.
 */

export const LOCAL_AI_DB_VERSION = 1;

export const LOCAL_AI_STORES = {
  conversations: "conversations",
  messages: "messages",
};

export const LOCAL_AI_MESSAGE_INDEX = "byConversation";

export function localAiDatabaseName(userId, workspaceId) {
  return `lumaflow-ai:${String(userId ?? "anon")}:${String(workspaceId ?? "default")}`;
}

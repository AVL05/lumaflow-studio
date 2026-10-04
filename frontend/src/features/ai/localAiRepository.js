import {
  LOCAL_AI_DB_VERSION,
  LOCAL_AI_MESSAGE_INDEX,
  LOCAL_AI_STORES,
  localAiDatabaseName,
} from "./localAiSchema";

const LEGACY_STORAGE_KEY = "lumaflow_webgpu_conversations";

/**
 * Repositorio del historial local de IA (Issue #10).
 *
 * IndexedDB nativo, sin dependencias: conversaciones y mensajes con
 * escritura transaccional, namespace por usuario/workspace y fallback en
 * memoria si el navegador no ofrece persistencia. Nunca envia contenido
 * al backend; el historial del modo Ollama sigue en sus tablas actuales.
 */

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function openDatabase(name) {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB no disponible."));
      return;
    }

    const request = indexedDB.open(name, LOCAL_AI_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LOCAL_AI_STORES.conversations)) {
        db.createObjectStore(LOCAL_AI_STORES.conversations, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(LOCAL_AI_STORES.messages)) {
        const store = db.createObjectStore(LOCAL_AI_STORES.messages, { keyPath: "id" });
        store.createIndex(LOCAL_AI_MESSAGE_INDEX, "conversationId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir el historial."));
  });
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Operación de historial fallida."));
  });
}

function readAll(store) {
  return promisify(store.getAll());
}

function transactionStores(db, stores, mode) {
  const transaction = db.transaction(stores, mode);
  return stores.map((name) => transaction.objectStore(name));
}

export function autoTitle(content) {
  const firstLine = String(content ?? "")
    .split("\n")[0]
    .trim();
  return firstLine.slice(0, 60) || "Conversación";
}

export function buildExport(conversation, messages) {
  const items = [...messages]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((message) => ({
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }));

  return {
    json: JSON.stringify(
      {
        title: conversation.title,
        exportedAt: new Date().toISOString(),
        modelId: conversation.modelId ?? null,
        messages: items,
      },
      null,
      2,
    ),
    markdown: [
      `# ${conversation.title}`,
      "",
      ...items.flatMap((message) => [`## ${message.role}`, "", message.content, ""]),
    ].join("\n"),
  };
}

function toRepositoryShape(conversation, messages) {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt) || (a.seq ?? 0) - (b.seq ?? 0),
  );
  return { ...conversation, messages: sorted, messages_count: sorted.length };
}

async function importLegacyConversations(repository) {
  let parsed = [];
  try {
    parsed = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]");
  } catch {
    parsed = [];
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return 0;

  let imported = 0;
  for (const item of parsed.slice(0, 30)) {
    const conversation = await repository.createConversation({
      title: item.title || autoTitle(item.messages?.[0]?.content),
      modelId: null,
      provider: item.provider ?? "webgpu",
      keepId: typeof item.id === "string" ? item.id : undefined,
    });
    for (const message of item.messages ?? []) {
      await repository.appendMessage(conversation.id, {
        role: message.role === "assistant" ? "assistant" : "user",
        content: String(message.content ?? ""),
      });
    }
    imported += 1;
  }

  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // El historial ya quedo importado; no bloquear por el almacenamiento viejo.
  }

  return imported;
}

function createIndexedDbRepository(db, namespace) {
  return {
    namespace,
    persistent: true,

    async listConversations() {
      const [store] = transactionStores(db, [LOCAL_AI_STORES.conversations], "readonly");
      const conversations = await readAll(store);
      return conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    async getConversation(id) {
      const [conversationStore, messageStore] = transactionStores(
        db,
        [LOCAL_AI_STORES.conversations, LOCAL_AI_STORES.messages],
        "readonly",
      );
      const conversation = await promisify(conversationStore.get(id));
      if (!conversation) return null;
      const messages = await promisify(messageStore.index(LOCAL_AI_MESSAGE_INDEX).getAll(id));
      return toRepositoryShape(conversation, messages);
    },

    async createConversation({
      title,
      modelId = null,
      context = null,
      provider = "webgpu",
      keepId,
    } = {}) {
      const now = new Date().toISOString();
      const conversation = {
        id: keepId || newId(),
        title: String(title || autoTitle("")).slice(0, 120),
        createdAt: now,
        updatedAt: now,
        modelId,
        context,
        provider,
        messages_count: 0,
      };
      const [store] = transactionStores(db, [LOCAL_AI_STORES.conversations], "readwrite");
      await promisify(store.put(conversation));
      return { ...conversation, messages: [] };
    },

    async appendMessage(conversationId, { role, content }) {
      const [conversationStore, messageStore] = transactionStores(
        db,
        [LOCAL_AI_STORES.conversations, LOCAL_AI_STORES.messages],
        "readwrite",
      );
      const conversation = await promisify(conversationStore.get(conversationId));
      if (!conversation) throw new Error("Conversación no encontrada.");

      const message = {
        id: newId(),
        conversationId,
        seq: (conversation.messages_count ?? 0) + 1,
        role: role === "assistant" ? "assistant" : "user",
        content: String(content ?? ""),
        createdAt: new Date().toISOString(),
      };
      await promisify(messageStore.put(message));
      const updated = {
        ...conversation,
        updatedAt: message.createdAt,
        messages_count: (conversation.messages_count ?? 0) + 1,
      };
      await promisify(conversationStore.put(updated));
      return message;
    },

    async renameConversation(id, title) {
      const clean = String(title ?? "")
        .trim()
        .slice(0, 120);
      if (!clean) throw new Error("El título no puede estar vacío.");
      const [store] = transactionStores(db, [LOCAL_AI_STORES.conversations], "readwrite");
      const conversation = await promisify(store.get(id));
      if (!conversation) throw new Error("Conversación no encontrada.");
      const updated = { ...conversation, title: clean, updatedAt: new Date().toISOString() };
      await promisify(store.put(updated));
      return updated;
    },

    async deleteConversation(id) {
      const [conversationStore, messageStore] = transactionStores(
        db,
        [LOCAL_AI_STORES.conversations, LOCAL_AI_STORES.messages],
        "readwrite",
      );
      await promisify(conversationStore.delete(id));
      const keys = await promisify(messageStore.index(LOCAL_AI_MESSAGE_INDEX).getAllKeys(id));
      for (const key of keys) {
        await promisify(messageStore.delete(key));
      }
      const remaining = await promisify(messageStore.index(LOCAL_AI_MESSAGE_INDEX).getAllKeys(id));
      return remaining.length === 0;
    },

    async clearWorkspaceHistory() {
      const [conversationStore, messageStore] = transactionStores(
        db,
        [LOCAL_AI_STORES.conversations, LOCAL_AI_STORES.messages],
        "readwrite",
      );
      await promisify(conversationStore.clear());
      await promisify(messageStore.clear());
    },

    async exportConversation(id) {
      const full = await this.getConversation(id);
      if (!full) throw new Error("Conversación no encontrada.");
      const { messages, ...conversation } = full;
      return buildExport(conversation, messages);
    },

    migrateLegacy() {
      return importLegacyConversations(this);
    },
  };
}

function createMemoryRepository(namespace) {
  const conversations = new Map();
  const messages = new Map();

  const sortedMessages = (conversationId) =>
    [...messages.values()]
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || (a.seq ?? 0) - (b.seq ?? 0));

  return {
    namespace,
    persistent: false,

    async listConversations() {
      return [...conversations.values()].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      );
    },

    async getConversation(id) {
      const conversation = conversations.get(id);
      if (!conversation) return null;
      return toRepositoryShape(conversation, sortedMessages(id));
    },

    async createConversation({
      title,
      modelId = null,
      context = null,
      provider = "webgpu",
      keepId,
    } = {}) {
      const now = new Date().toISOString();
      const conversation = {
        id: keepId || newId(),
        title: String(title || autoTitle("")).slice(0, 120),
        createdAt: now,
        updatedAt: now,
        modelId,
        context,
        provider,
        messages_count: 0,
      };
      conversations.set(conversation.id, conversation);
      return { ...conversation, messages: [] };
    },

    async appendMessage(conversationId, { role, content }) {
      const conversation = conversations.get(conversationId);
      if (!conversation) throw new Error("Conversación no encontrada.");
      const message = {
        id: newId(),
        conversationId,
        seq: sortedMessages(conversationId).length + 1,
        role: role === "assistant" ? "assistant" : "user",
        content: String(content ?? ""),
        createdAt: new Date().toISOString(),
      };
      messages.set(message.id, message);
      conversations.set(conversationId, {
        ...conversation,
        updatedAt: message.createdAt,
        messages_count: sortedMessages(conversationId).length,
      });
      return message;
    },

    async renameConversation(id, title) {
      const clean = String(title ?? "")
        .trim()
        .slice(0, 120);
      if (!clean) throw new Error("El título no puede estar vacío.");
      const conversation = conversations.get(id);
      if (!conversation) throw new Error("Conversación no encontrada.");
      const updated = { ...conversation, title: clean, updatedAt: new Date().toISOString() };
      conversations.set(id, updated);
      return updated;
    },

    async deleteConversation(id) {
      conversations.delete(id);
      for (const [key, message] of messages) {
        if (message.conversationId === id) messages.delete(key);
      }
      return sortedMessages(id).length === 0;
    },

    async clearWorkspaceHistory() {
      conversations.clear();
      messages.clear();
    },

    async exportConversation(id) {
      const full = await this.getConversation(id);
      if (!full) throw new Error("Conversación no encontrada.");
      const { messages: items, ...conversation } = full;
      return buildExport(conversation, items);
    },

    migrateLegacy() {
      return importLegacyConversations(this);
    },
  };
}

export async function createLocalAiRepository({ userId, workspaceId } = {}) {
  const namespace = localAiDatabaseName(userId, workspaceId);

  try {
    const db = await openDatabase(namespace);
    return createIndexedDbRepository(db, namespace);
  } catch {
    return createMemoryRepository(namespace);
  }
}

export { LEGACY_STORAGE_KEY };

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { autoTitle, buildExport, createLocalAiRepository } from "./localAiRepository";
import { localAiDatabaseName } from "./localAiSchema";

function repositoryFor(suffix) {
  return createLocalAiRepository({ userId: `user-${suffix}`, workspaceId: `ws-${suffix}` });
}

describe("localAiRepository", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("crea, lista, renombra y borra con cascada verificable", async () => {
    const repository = await repositoryFor("crud");
    expect(repository.persistent).toBe(true);

    const conversation = await repository.createConversation({
      title: "Duda de boda",
      modelId: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
      context: { type: "job", resourceId: "123", label: "Boda Laura y Miguel" },
    });
    await repository.appendMessage(conversation.id, { role: "user", content: "Hola" });
    await repository.appendMessage(conversation.id, {
      role: "assistant",
      content: "Hola, ¿qué necesitas?",
    });

    const listed = await repository.listConversations();
    expect(listed).toHaveLength(1);
    expect(listed[0].messages_count).toBe(2);

    const full = await repository.getConversation(conversation.id);
    expect(full.messages.map((message) => message.role)).toEqual(["user", "assistant"]);

    const renamed = await repository.renameConversation(conversation.id, "  Boda Laura  ");
    expect(renamed.title).toBe("Boda Laura");

    const cleaned = await repository.deleteConversation(conversation.id);
    expect(cleaned).toBe(true);
    expect(await repository.getConversation(conversation.id)).toBeNull();
    expect(await repository.listConversations()).toEqual([]);
  });

  it("aisla historiales por usuario y workspace", async () => {
    const mine = await repositoryFor("mine");
    const other = await createLocalAiRepository({ userId: "user-mine", workspaceId: "ws-other" });

    expect(mine.namespace).toBe(localAiDatabaseName("user-mine", "ws-mine"));
    await mine.createConversation({ title: "Mía" });

    expect(await other.listConversations()).toEqual([]);
    expect(await mine.listConversations()).toHaveLength(1);
  });

  it("sobrevive a una nueva instancia del repositorio", async () => {
    const first = await repositoryFor("reopen");
    const created = await first.createConversation({ title: "Persistente" });
    await first.appendMessage(created.id, { role: "user", content: "sigo aquí" });

    const second = await repositoryFor("reopen");
    const reopened = await second.getConversation(created.id);
    expect(reopened.messages.map((message) => message.content)).toEqual(["sigo aquí"]);
  });

  it("migra el historial legacy una sola vez", async () => {
    localStorage.setItem(
      "lumaflow_webgpu_conversations",
      JSON.stringify([
        { id: "webgpu-1", title: "Vieja", messages: [{ role: "user", content: "ey" }] },
      ]),
    );

    const repository = await repositoryFor("legacy");
    expect(await repository.migrateLegacy()).toBe(1);
    expect(localStorage.getItem("lumaflow_webgpu_conversations")).toBeNull();

    const listed = await repository.listConversations();
    expect(listed).toHaveLength(1);
    expect((await repository.getConversation(listed[0].id)).messages).toHaveLength(1);
    expect(await repository.migrateLegacy()).toBe(0);
  });

  it("usa memoria y avisa cuando IndexedDB falla", async () => {
    const repository = await createLocalAiRepository({ userId: "x", workspaceId: "y" });
    expect(repository.persistent).toBe(true);

    const failing = await (async () => {
      const realOpen = indexedDB.open.bind(indexedDB);
      const sabotage = () => {
        throw new Error("denegado");
      };
      Object.defineProperty(window, "indexedDB", { value: { open: sabotage }, configurable: true });
      try {
        return await createLocalAiRepository({ userId: "x", workspaceId: "y" });
      } finally {
        Object.defineProperty(window, "indexedDB", {
          value: { open: realOpen },
          configurable: true,
        });
      }
    })();

    expect(failing.persistent).toBe(false);
    const created = await failing.createConversation({ title: "Sesión" });
    await failing.appendMessage(created.id, { role: "user", content: "hola" });
    expect((await failing.getConversation(created.id)).messages).toHaveLength(1);
  });

  it("carga historial de otro modelo sin bloquear", async () => {
    const repository = await repositoryFor("models");
    const created = await repository.createConversation({
      title: "Vieja",
      modelId: "modelo-antiguo",
    });
    await repository.appendMessage(created.id, { role: "user", content: "hola" });

    const reopened = await repository.getConversation(created.id);
    expect(reopened.modelId).toBe("modelo-antiguo");
    expect(reopened.messages).toHaveLength(1);
  });

  it("exporta sin tokens ni prompts internos", async () => {
    const conversation = { title: "Boda", modelId: "m-1" };
    const messages = [
      { role: "user", content: "¿Cuándo?", createdAt: "2026-01-01T10:00:00.000Z" },
      { role: "assistant", content: "En junio.", createdAt: "2026-01-01T10:01:00.000Z" },
    ];

    const exported = buildExport(conversation, messages);
    expect(exported.markdown).toContain("# Boda");
    expect(exported.markdown).toContain("En junio.");
    expect(exported.json).toContain("2026-01-01");
    expect(exported.json).not.toContain("system");
  });

  it("titula desde el primer mensaje sin proveedor externo", () => {
    expect(autoTitle("  Primera línea\nsegunda")).toBe("Primera línea");
    expect(autoTitle("")).toBe("Conversación");
  });
});

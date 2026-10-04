import { expect, test } from "../fixtures/test.js";
import { apiRequest } from "../support/app.js";
import { localAiDatabaseName } from "../../frontend/src/features/ai/localAiSchema.js";

const SEED = {
  title: "Charla E2E",
  modelId: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  userMessage: "¿Qué objetivo uso para retrato?",
  assistantMessage: "Un 85mm luminoso es una gran opción.",
};

async function namespaceOf(page) {
  const response = await apiRequest(page, "GET", "/user");
  expect(response.status()).toBe(200);
  const user = (await response.json()).data;
  return { userId: user.id, workspaceId: user.current_workspace_id };
}

async function seedConversation(page, namespace) {
  return page.evaluate(
    async ({ userId, workspaceId, seed }) => {
      const repository = await import("/src/features/ai/localAiRepository.js").then((module) =>
        module.createLocalAiRepository({ userId, workspaceId }),
      );
      const conversation = await repository.createConversation({
        title: seed.title,
        modelId: seed.modelId,
      });
      await repository.appendMessage(conversation.id, { role: "user", content: seed.userMessage });
      await repository.appendMessage(conversation.id, {
        role: "assistant",
        content: seed.assistantMessage,
      });
      return conversation.id;
    },
    { ...namespace, seed: SEED },
  );
}

async function storedConversations(page, namespace) {
  return page.evaluate(async ({ userId, workspaceId }) => {
    const repository = await import("/src/features/ai/localAiRepository.js").then((module) =>
      module.createLocalAiRepository({ userId, workspaceId }),
    );
    return repository.listConversations();
  }, namespace);
}

test.describe("historial de IA local", () => {
  test("persiste tras recarga, se renombra y se borra con cascada", async ({
    ownerPage,
    outsiderPage,
  }) => {
    const namespace = await namespaceOf(ownerPage);
    const conversationId = await seedConversation(ownerPage, namespace);

    ownerPage.on("dialog", async (dialog) => {
      if (dialog.type() === "prompt") await dialog.accept("Charla Renombrada");
      else await dialog.accept();
    });

    // El historial se carga sin necesidad de modelo ni GPU.
    await ownerPage.goto("/app/ai-assistant");
    await expect(ownerPage.getByText("Charla E2E")).toBeVisible();
    await ownerPage.getByText("Charla E2E").click();
    await expect(ownerPage.getByText(SEED.assistantMessage)).toBeVisible();

    // Recarga: la conversación sigue presente (IndexedDB real).
    await ownerPage.reload();
    await expect(ownerPage.getByText("Charla E2E")).toBeVisible();

    // Renombrar desde la UI.
    await ownerPage.getByText("Charla E2E").click();
    await ownerPage.getByText("Editar").first().click();
    await expect(ownerPage.getByText("Charla Renombrada").first()).toBeVisible();

    // Borrar elimina conversación y mensajes (lectura directa posterior).
    await ownerPage.getByText("Charla Renombrada").first().click();
    await ownerPage.getByText("Borrar").first().click();
    await expect(ownerPage.getByText("Sin conversaciones.")).toBeVisible();

    const remaining = await storedConversations(ownerPage, namespace);
    expect(remaining.find((item) => item.id === conversationId)).toBeUndefined();

    await ownerPage.reload();
    await expect(ownerPage.getByText("Sin conversaciones.")).toBeVisible();

    // Otra cuenta no ve este historial (namespace distinto, base vacía).
    const outsiderNamespace = await namespaceOf(outsiderPage);
    expect(localAiDatabaseName(outsiderNamespace.userId, outsiderNamespace.workspaceId)).not.toBe(
      localAiDatabaseName(namespace.userId, namespace.workspaceId),
    );
    const foreign = await storedConversations(outsiderPage, outsiderNamespace);
    expect(foreign).toEqual([]);

    await outsiderPage.goto("/app/ai-assistant");
    await expect(outsiderPage.getByText("Sin conversaciones.")).toBeVisible();
  });
});

import { expect, test } from "../fixtures/test.js";
import { accounts } from "../support/accounts.js";
import { apiRequest, findResourceId } from "../support/app.js";

test.describe("estudio compartido", () => {
  test("el propietario invita, el miembro accede y al retirarlo pierde el acceso", async ({
    ownerPage,
    outsiderPage,
    guestPage,
  }) => {
    const suffix = Date.now();
    const clientName = `Cliente Equipo E2E ${suffix}`;

    // El propietario crea un cliente en su estudio.
    await ownerPage.goto("/app/clients");
    await ownerPage.getByRole("button", { name: "Nuevo cliente" }).click();

    const clientDialog = ownerPage.getByRole("dialog");
    await clientDialog.getByLabel("Nombre", { exact: true }).fill(clientName);
    await clientDialog.getByRole("button", { name: "Guardar cliente" }).click();
    await expect(clientDialog).toBeHidden();

    const clientId = await findResourceId(ownerPage, "/clients", "name", clientName);

    // Sin membership no se alcanza el recurso ajeno.
    const denied = await apiRequest(outsiderPage, "GET", `/clients/${clientId}`);
    expect(denied.status(), "sin membership el recurso ajeno es 404").toBe(404);

    // El propietario invita a la cuenta semilla con rol de miembro.
    const invite = await apiRequest(ownerPage, "POST", "/workspace/invitations", {
      email: accounts.guest.email,
      role: "member",
    });
    expect(invite.status(), "el propietario puede invitar").toBe(201);

    const { token } = (await invite.json()).meta;
    expect(token, "la invitacion expone el token una sola vez").toBeTruthy();

    // La invitada acepta y entra en el estudio compartido.
    const accepted = await apiRequest(guestPage, "POST", "/workspace/invitations/accept", { token });
    expect(accepted.status(), "el token valido crea la membership").toBe(201);

    await guestPage.goto("/app/clients");
    await expect(guestPage.getByRole("heading", { name: clientName })).toBeVisible();

    await guestPage.goto("/app/settings");
    await expect(guestPage.getByRole("heading", { name: "Miembros del estudio" })).toBeVisible();

    const members = await apiRequest(guestPage, "GET", "/workspace/members");
    expect(members.status()).toBe(200);
    const guestId = (await members.json()).data.find((item) => item.email === accounts.guest.email)?.user_id;
    expect(guestId, "el miembro aparece en la lista").toBeTruthy();

    // Al retirar la membership el acceso se corta de inmediato.
    const removed = await apiRequest(ownerPage, "DELETE", `/workspace/members/${guestId}`);
    expect(removed.status(), "el propietario puede retirar").toBe(204);

    const afterRemoval = await apiRequest(guestPage, "GET", `/clients/${clientId}`);
    expect(afterRemoval.status(), "tras la retirada el recurso es 404").toBe(404);
  });
});

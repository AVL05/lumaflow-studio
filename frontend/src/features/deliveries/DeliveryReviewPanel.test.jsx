import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { deliveriesApi } from "../../api/deliveries";
import { publicApi } from "../../api/public";
import { DeliveryReviewPanel } from "./DeliveryReviewPanel";

vi.mock("../../api/deliveries", () => ({
  deliveriesApi: { history: vi.fn(), publish: vi.fn(), respond: vi.fn(), portal: vi.fn() },
}));
vi.mock("../../api/public", () => ({
  publicApi: { deliveryHistory: vi.fn(), respondDelivery: vi.fn(), delivery: vi.fn() },
}));
const delivery = { id: 1, revision_number: 2, version: 3, review_state: "sent" };
const history = {
  revisions: {
    data: [
      {
        number: 1,
        gallery_url: "https://example.com/v1",
        notes: "Initial cut",
        recorded_at: "2030-01-01",
      },
    ],
    last_page: 1,
  },
  events: { data: [], last_page: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  deliveriesApi.history.mockResolvedValue(history);
  publicApi.deliveryHistory.mockResolvedValue(history);
});

it("requires preview and confirmation before publishing a numbered revision", async () => {
  const user = userEvent.setup();
  const onChanged = vi.fn();
  deliveriesApi.publish.mockResolvedValue({ ...delivery, revision_number: 3 });
  render(<DeliveryReviewPanel delivery={delivery} onChanged={onChanged} />);
  await user.click(screen.getByRole("button", { name: "Nueva revisión" }));
  await user.type(screen.getByLabelText("Enlace HTTPS de la revisión"), "https://vimeo.com/123");
  expect(deliveriesApi.publish).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Previsualizar revisión" }));
  expect(deliveriesApi.publish).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Confirmar publicación" }));
  await waitFor(() => expect(onChanged).toHaveBeenCalled());
  expect(deliveriesApi.publish).toHaveBeenCalledWith(
    1,
    expect.objectContaining({
      gallery_url: "https://vimeo.com/123",
      version: 3,
      request_id: expect.any(String),
    }),
  );
});

it("records explicit receipt against the displayed revision and has no creator controls in the portal", async () => {
  const user = userEvent.setup();
  publicApi.respondDelivery.mockResolvedValue({ ...delivery, review_state: "received" });
  render(<DeliveryReviewPanel delivery={delivery} token="synthetic" onChanged={vi.fn()} />);
  await screen.findByRole("link", { name: "Abrir revisión 1" });
  expect(publicApi.respondDelivery).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Nueva revisión" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Confirmar recepción" }));
  expect(publicApi.respondDelivery).toHaveBeenCalledWith(
    "synthetic",
    "receive",
    expect.objectContaining({ revision_number: 2 }),
  );
  expect(publicApi.respondDelivery.mock.calls[0][2]).not.toHaveProperty("message");
});

it("preserves comment text and request identity after an uncertain failure", async () => {
  const user = userEvent.setup();
  publicApi.respondDelivery
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValueOnce(delivery);
  render(<DeliveryReviewPanel delivery={delivery} token="synthetic" onChanged={vi.fn()} />);
  await user.type(screen.getByLabelText("Observaciones sobre esta revisión"), "Synthetic note");
  await user.click(screen.getByRole("button", { name: "Añadir comentario" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Observaciones sobre esta revisión")).toHaveValue("Synthetic note");
  const requestId = publicApi.respondDelivery.mock.calls[0][2].request_id;
  await user.click(screen.getByRole("button", { name: "Añadir comentario" }));
  expect(publicApi.respondDelivery.mock.calls[1][2].request_id).toBe(requestId);
});

it("does not render unsafe historic links and requires confirmation to revoke the portal", async () => {
  const user = userEvent.setup();
  deliveriesApi.history.mockResolvedValue({
    ...history,
    revisions: {
      data: [{ number: 1, gallery_url: "javascript:alert(1)", recorded_at: "2030-01-01" }],
      last_page: 1,
    },
  });
  deliveriesApi.portal.mockResolvedValue(delivery);
  render(<DeliveryReviewPanel delivery={delivery} onChanged={vi.fn()} />);
  await screen.findByText("Revisión 1");
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Revocar portal" }));
  expect(deliveriesApi.portal).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Confirmar cambio de acceso" }));
  expect(deliveriesApi.portal).toHaveBeenCalledWith(1, {
    version: 3,
    action: "revoke",
    expires_on: null,
  });
});

it("refreshes the current revision while preserving unsent observations", async () => {
  const user = userEvent.setup();
  const onChanged = vi.fn();
  publicApi.delivery.mockResolvedValue({ ...delivery, revision_number: 3, version: 4 });
  render(<DeliveryReviewPanel delivery={delivery} token="synthetic" onChanged={onChanged} />);
  await user.type(screen.getByLabelText("Observaciones sobre esta revisión"), "Unsent note");
  await user.click(screen.getByRole("button", { name: "Actualizar entrega" }));
  await waitFor(() =>
    expect(onChanged).toHaveBeenCalledWith(expect.objectContaining({ revision_number: 3 })),
  );
  expect(screen.getByLabelText("Observaciones sobre esta revisión")).toHaveValue("Unsent note");
});

it("uses a new request for a comment after a successful change request", async () => {
  const user = userEvent.setup();
  deliveriesApi.respond.mockResolvedValue(delivery);
  render(<DeliveryReviewPanel delivery={delivery} onChanged={vi.fn()} />);
  await user.type(screen.getByLabelText("Observaciones sobre esta revisión"), "Please adjust");
  await user.click(screen.getByRole("button", { name: "Registrar cambios solicitados" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Observaciones sobre esta revisión")).toHaveValue(""),
  );
  const requestId = deliveriesApi.respond.mock.calls[0][2].request_id;
  await user.type(
    screen.getByLabelText("Observaciones sobre esta revisión"),
    "Another observation",
  );
  await user.click(screen.getByRole("button", { name: "Añadir comentario" }));
  expect(deliveriesApi.respond.mock.calls[1][2].request_id).not.toBe(requestId);
});

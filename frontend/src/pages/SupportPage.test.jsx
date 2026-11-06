import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SupportPage } from "./SupportPage";

const kofi = "https://ko-fi.com/lfsynthetic00000000000001";
const sponsors = "https://github.com/sponsors/lf-synthetic-00000000000001";

beforeEach(() => {
  vi.stubEnv("VITE_KOFI_URL", "");
  vi.stubEnv("VITE_GITHUB_SPONSORS_URL", "");
});
afterEach(() => vi.unstubAllEnvs());
const show = () =>
  render(
    <MemoryRouter>
      <SupportPage />
    </MemoryRouter>,
  );

it("explains permanent free access without payment buttons when unconfigured", () => {
  show();
  expect(
    screen.getByRole("heading", { level: 1, name: "LumaFlow seguirá siendo gratuito." }),
  ).toBeVisible();
  expect(screen.getByText(/Los canales de apoyo todavía no están disponibles/)).toBeVisible();
  expect(screen.queryByRole("link", { name: /^Apoyar en/ })).not.toBeInTheDocument();
  expect(screen.getByText(/Dones o no, tendrás las mismas funcionalidades/)).toBeVisible();
  expect(screen.getByRole("link", { name: /Contribuir en GitHub/ })).toHaveAttribute(
    "href",
    "https://github.com/AVL05/lumaflow-studio",
  );
});

it.each([
  [kofi, "", ["Ko-fi"]],
  ["", sponsors, ["GitHub Sponsors"]],
  [kofi, sponsors, ["Ko-fi", "GitHub Sponsors"]],
])(
  "renders independently configured providers with safe external links",
  (kofiUrl, sponsorsUrl, names) => {
    vi.stubEnv("VITE_KOFI_URL", kofiUrl);
    vi.stubEnv("VITE_GITHUB_SPONSORS_URL", sponsorsUrl);
    show();
    const links = screen.getAllByRole("link", { name: /^Apoyar en/ });
    expect(links).toHaveLength(names.length);
    for (const name of names) {
      const link = screen.getByRole("link", { name: `Apoyar en ${name} (nueva pestaña)` });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
    }
    expect(screen.queryByText(/Los canales de apoyo todavía/)).not.toBeInTheDocument();
  },
);

it("hides invalid configuration without exposing it or loading payment embeds", () => {
  vi.stubEnv("VITE_KOFI_URL", "https://evil.test/PRIVATE_CONFIG_CANARY");
  vi.stubEnv("VITE_GITHUB_SPONSORS_URL", "javascript:alert(1)");
  show();
  expect(screen.queryByRole("link", { name: /^Apoyar en/ })).not.toBeInTheDocument();
  expect(document.body.textContent).not.toContain("PRIVATE_CONFIG_CANARY");
  expect(document.querySelector("iframe, script[src*='ko-fi'], script[src*='github']")).toBeNull();
});

it("keeps a valid provider available when another provider is invalid", () => {
  vi.stubEnv("VITE_KOFI_URL", kofi);
  vi.stubEnv("VITE_GITHUB_SPONSORS_URL", "https://evil.test/sponsors/synthetic");
  show();
  expect(screen.getAllByRole("link", { name: /^Apoyar en/ })).toHaveLength(1);
  expect(screen.getByRole("link", { name: /Apoyar en Ko-fi/ })).toHaveAttribute("href", kofi);
});

it("supports keyboard navigation and exposes the discreet footer link", async () => {
  const user = userEvent.setup();
  vi.stubEnv("VITE_KOFI_URL", kofi);
  show();
  await user.tab();
  expect(screen.getByRole("link", { name: "Saltar al contenido" })).toHaveFocus();
  const link = screen.getByRole("link", { name: /Apoyar en Ko-fi/ });
  link.focus();
  expect(link).toHaveFocus();
  expect(
    within(screen.getByRole("contentinfo")).getByRole("link", { name: "Apoyar LumaFlow" }),
  ).toHaveAttribute("href", "/support");
});

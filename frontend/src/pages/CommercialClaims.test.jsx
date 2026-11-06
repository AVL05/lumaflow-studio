import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage";
import { PrivacyPage } from "./PrivacyPage";
import { AboutProjectPage } from "./AboutProjectPage";

describe("commercial claims reflect the external-delivery product", () => {
  it.each([
    ["landing", LandingPage],
    ["privacy", PrivacyPage],
    ["about", AboutProjectPage],
  ])("does not promise photo hosting or selection in %s", (_name, Page) => {
    const { container } = render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>,
    );
    expect(container.textContent).not.toMatch(
      /S3|seleccionar favoritas|seleccion de favoritas|Galerías privadas y favoritos|Carga multiple|Fotografías que decides subir/,
    );
    expect(container.textContent).toMatch(/extern[oa]s?/i);
  });

  it("separates free access from the beta's maturity", () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(container.textContent).not.toContain("Si el modelo cambia");
    expect(container.textContent).toMatch(/donaciones.*voluntarias/i);
  });
});

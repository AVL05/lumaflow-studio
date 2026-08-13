import { describe, expect, it } from "vitest";
import { parseClientCsv } from "./clientCsv";

describe("parseClientCsv", () => {
  it("acepta cabeceras españolas, comillas y campos opcionales", () => {
    expect(
      parseClientCsv('Nombre,Correo,Teléfono,Empresa,Notas\n"Ana, Pérez",ana@example.com,600123123,AP,"Boda, junio"'),
    ).toEqual([
      {
        name: "Ana, Pérez",
        email: "ana@example.com",
        phone: "600123123",
        company: "AP",
        notes: "Boda, junio",
      },
    ]);
  });

  it("rechaza archivos sin nombre", () => {
    expect(() => parseClientCsv("Email\nana@example.com")).toThrow(/nombre/);
  });

  it("acepta el separador de Excel en español", () => {
    expect(parseClientCsv("Nombre;Correo\nBruno;bruno@example.com")[0].email).toBe(
      "bruno@example.com",
    );
  });
});

const aliases = {
  name: ["name", "nombre", "cliente"],
  email: ["email", "correo", "correo electronico", "correo electrónico"],
  phone: ["phone", "telefono", "teléfono", "movil", "móvil"],
  company: ["company", "empresa", "estudio"],
  notes: ["notes", "notas", "observaciones"],
};

export function parseClientCsv(text) {
  const cleanText = text.replace(/^\uFEFF/, "");
  const firstLine = cleanText.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";
  const matrix = parseCsv(cleanText, delimiter).filter((row) => row.some(Boolean));
  if (matrix.length < 2) throw new Error("El CSV debe incluir cabecera y al menos un cliente.");

  const headers = matrix[0].map((header) => header.trim().toLocaleLowerCase("es"));
  const indexes = Object.fromEntries(
    Object.entries(aliases).map(([key, values]) => [
      key,
      headers.findIndex((header) => values.includes(header)),
    ]),
  );

  if (indexes.name === -1) throw new Error('No encontramos la columna obligatoria "nombre".');

  const rows = matrix.slice(1).map((values) =>
    Object.fromEntries(
      Object.entries(indexes).map(([key, index]) => [
        key,
        index >= 0 ? values[index]?.trim() || null : null,
      ]),
    ),
  );

  if (rows.some((row) => !row.name)) throw new Error("Hay filas sin nombre de cliente.");
  return rows;
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

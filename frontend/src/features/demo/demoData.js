export const demoAgenda = [
  {
    id: 1,
    time: "09:00",
    title: "Retrato editorial",
    client: "Clara Montiel",
    type: "Sesión",
    status: "Confirmada",
  },
  {
    id: 2,
    time: "12:30",
    title: "Revisión de presupuesto",
    client: "Atelier Norte",
    type: "Negocio",
    status: "Pendiente",
  },
  {
    id: 3,
    time: "17:00",
    title: "Entrega de galería",
    client: "Marta y Dani",
    type: "Entrega",
    status: "Preparada",
  },
];

export const demoWeek = [
  { day: "Lun", date: "17", events: ["Preproducción Atelier Norte"] },
  { day: "Mar", date: "18", events: ["Retrato editorial", "Selección de favoritas"] },
  { day: "Mié", date: "19", events: ["Edición boda Marta y Dani"] },
  { day: "Jue", date: "20", events: ["Producto Casa Olmo", "Enviar presupuesto"] },
  { day: "Vie", date: "21", events: ["Entrega galería Clara"] },
];

export const demoClients = [
  {
    id: 1,
    name: "Clara Montiel",
    company: "Marca personal",
    status: "Activo",
    jobs: 3,
    billed: "1.450 €",
    next: "Retrato editorial, 18 de agosto",
    note: "Busca una serie sobria para prensa y web profesional.",
  },
  {
    id: 2,
    name: "Atelier Norte",
    company: "Interiorismo",
    status: "Presupuesto",
    jobs: 2,
    billed: "2.100 €",
    next: "Revisión de presupuesto, hoy",
    note: "Campaña de cuatro espacios con entrega por fases.",
  },
  {
    id: 3,
    name: "Marta y Dani",
    company: "Boda",
    status: "Entrega",
    jobs: 1,
    billed: "1.300 €",
    next: "Galería preparada para revisión",
    note: "Han solicitado una selección breve para impresión.",
  },
];

export const demoPhotos = [
  { id: 1, name: "CM-014.jpg", tone: "from-stone-500 to-stone-800", favorite: true },
  { id: 2, name: "CM-027.jpg", tone: "from-amber-900 to-stone-900", favorite: false },
  { id: 3, name: "CM-041.jpg", tone: "from-neutral-600 to-zinc-950", favorite: true },
  { id: 4, name: "CM-063.jpg", tone: "from-yellow-950 to-neutral-800", favorite: false },
  { id: 5, name: "CM-078.jpg", tone: "from-stone-700 to-amber-950", favorite: false },
  { id: 6, name: "CM-092.jpg", tone: "from-zinc-500 to-stone-900", favorite: false },
];

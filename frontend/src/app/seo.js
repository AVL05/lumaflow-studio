export const siteUrl = "https://lumaflow.aleviclop.dev";

export const publicPages = [
  {
    path: "/",
    title: "CRM gratuito para fotógrafos y filmmakers | LumaFlow Studio",
    description:
      "Organiza clientes, proyectos, sesiones, presupuestos, facturas y entregas por enlaces externos. LumaFlow es gratuito, open source y no pide tarjeta.",
  },
  {
    path: "/features",
    title: "Gestión de estudios y proyectos fotográficos | LumaFlow",
    description:
      "Organiza clientes, prepara sesiones, controla presupuestos y facturas y sigue la aprobación de entregas alojadas en tus proveedores externos.",
  },
  {
    path: "/pricing",
    title: "LumaFlow gratis: funciones y apoyo voluntario",
    description:
      "Todas las funciones de LumaFlow son gratuitas. Sin tarjeta, planes premium ni privilegios por donar. El apoyo al proyecto es voluntario.",
  },
  {
    path: "/privacy",
    title: "Privacidad e IA local para tu estudio | LumaFlow",
    description:
      "Conoce los datos que guarda la API, el historial local WebGPU y los enlaces de entrega a proveedores externos. LumaFlow no aloja tus originales.",
  },
  {
    path: "/about-project",
    title: "Sobre LumaFlow Studio: proyecto gratuito y open source",
    description:
      "Conoce LumaFlow Studio, su autor, licencia y arquitectura. Un CRM gratuito para organizar el negocio y el flujo de trabajo de fotografía y vídeo.",
  },
  {
    path: "/support",
    title: "Apoyar LumaFlow: aportaciones siempre voluntarias",
    description:
      "Contribuye al mantenimiento de LumaFlow. Todas las funciones siguen siendo gratuitas, dones o no. Sin ventajas exclusivas ni aportaciones obligatorias.",
  },
];

export const sensitiveQuery = /(?:^|[?&])(?:token|signature|email)=/i;

export function getRouteMeta(pathname, search = "") {
  const page = publicPages.find((item) => item.path === pathname);
  if (!page || sensitiveQuery.test(search)) {
    return {
      title: "LumaFlow Studio",
      description: "Acceso y gestión privada de tu estudio en LumaFlow Studio.",
      robots: "noindex, nofollow, nosnippet",
    };
  }
  return {
    ...page,
    canonical: siteUrl + page.path,
    image: siteUrl + "/product/dashboard.png",
    robots: "index, follow",
  };
}

export function getMetaTags(meta) {
  const tags = [
    { name: "description", content: meta.description },
    { name: "robots", content: meta.robots },
  ];
  if (meta.canonical) {
    tags.push(
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_ES" },
      { property: "og:site_name", content: "LumaFlow Studio" },
      { property: "og:title", content: meta.title },
      { property: "og:description", content: meta.description },
      { property: "og:url", content: meta.canonical },
      { property: "og:image", content: meta.image },
      { property: "og:image:alt", content: "LumaFlow Studio con datos de demostración" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: meta.title },
      { name: "twitter:description", content: meta.description },
      { name: "twitter:image", content: meta.image },
    );
  }
  return tags;
}

export function getStructuredData(pathname) {
  if (pathname !== "/") return null;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": siteUrl + "/#website",
        name: "LumaFlow Studio",
        url: siteUrl + "/",
        inLanguage: "es",
      },
      {
        "@type": "SoftwareApplication",
        "@id": siteUrl + "/#software",
        name: "LumaFlow Studio",
        url: siteUrl + "/",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: publicPages[0].description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      },
    ],
  };
}

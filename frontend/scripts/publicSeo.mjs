import { readFile, stat } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import {
  getMetaTags,
  getRouteMeta,
  getStructuredData,
  publicPages,
  siteUrl,
} from "../src/app/seo.js";

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );
}

function withHead(html, pathname) {
  const meta = getRouteMeta(pathname);
  const tags = getMetaTags(meta).map(
    (attributes) =>
      `<meta ${Object.entries(attributes)
        .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
        .join(" ")}>`,
  );
  tags.push(`<title>${escapeHtml(meta.title)}</title>`);
  if (meta.canonical) tags.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}">`);
  const data = meta.canonical && getStructuredData(pathname);
  if (data)
    tags.push(
      `<script type="application/ld+json" data-lumaflow-seo>${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`,
    );
  return html.replace(
    /<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/,
    `<!-- SEO_HEAD_START -->\n${tags.join("\n")}\n<!-- SEO_HEAD_END -->`,
  );
}

export function publicSeo() {
  let config;
  return {
    name: "lumaflow-public-seo",
    enforce: "post",
    configResolved(resolved) {
      config = resolved;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const pathname = context.server
          ? new URL(context.originalUrl ?? context.path, "http://localhost").pathname
          : "";
        return withHead(html, pathname);
      },
    },
    async generateBundle(_options, bundle) {
      // HTML is finalized before Workbox's closeBundle computes precache revisions.
      const shell = withHead(String(bundle["index.html"].source), "");
      this.emitFile({ type: "asset", fileName: "app-shell.html", source: shell });
      const server = await createServer({
        configFile: false,
        root: config.root,
        mode: config.mode,
        plugins: [react()],
        optimizeDeps: { noDiscovery: true, entries: [] },
        server: { middlewareMode: true, hmr: false, watch: null },
        appType: "custom",
      });
      try {
        const { renderPublicPage, renderNotFoundPage } =
          await server.ssrLoadModule("/src/app/prerender.jsx");
        for (const page of publicPages) {
          const source = withHead(shell, page.path).replace(
            '<div id="root"></div>',
            () => `<div id="root" data-prerendered="true">${renderPublicPage(page.path)}</div>`,
          );
          if (page.path === "/") bundle["index.html"].source = source;
          else this.emitFile({ type: "asset", fileName: page.path.slice(1) + ".html", source });
        }
        this.emitFile({
          type: "asset",
          fileName: "404.html",
          source: shell.replace(
            '<div id="root"></div>',
            () => `<div id="root" data-prerendered="true">${renderNotFoundPage()}</div>`,
          ),
        });
      } finally {
        await server.close();
      }
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPages.map((page) => `  <url><loc>${siteUrl}${page.path}</loc></url>`).join("\n")}\n</urlset>\n`,
      });
    },
    async configurePreviewServer(server) {
      const hosting = JSON.parse(await readFile(resolve(config.root, "vercel.json"), "utf8"));
      const directory = resolve(config.root, config.build.outDir);
      server.middlewares.use(async (request, response, next) => {
        try {
          const url = new URL(request.url, "http://localhost");
          for (const rule of hosting.routes) {
            if (rule.handle === "filesystem") {
              const file = resolve(
                directory,
                "." + decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
              );
              const inside = relative(directory, file);
              const entry = !inside.startsWith("..") && (await stat(file).catch(() => null));
              if (entry?.isFile()) return next();
              continue;
            }
            const match = url.pathname.match(new RegExp(rule.src));
            if (!match || rule.has?.some((condition) => !url.searchParams.has(condition.key)))
              continue;
            for (const [name, value] of Object.entries(rule.headers ?? {}))
              response.setHeader(
                name,
                value.replace(/\$(\d+)/g, (_, index) => match[index] ?? ""),
              );
            if (rule.continue) continue;
            response.statusCode = rule.status ?? 200;
            if (rule.status >= 300 && rule.status < 400) return response.end();
            const destination = rule.dest.replace(/\$(\d+)/g, (_, index) => match[index] ?? "");
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(
              request.method === "HEAD"
                ? undefined
                : await readFile(resolve(directory, "." + destination)),
            );
            return;
          }
          next();
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

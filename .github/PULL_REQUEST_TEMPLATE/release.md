## Release

<!-- Qué incluye esta release. Procedimiento: docs/release-checklist.md -->

Cierra / referencia: 

## Antes del merge

- [ ] `main` sincronizado y validación completa repetida
- [ ] CI verde del SHA a fusionar — SHA: 
- [ ] Migraciones revisadas (aditivas, ensayadas en MySQL) / sin migraciones
- [ ] Cambios de contrato en `docs/api.md` y variables nuevas en `.env.example` / proveedores
- [ ] Producción sana antes de empezar (`/up`, `/api/health`, login sintético)
- [ ] Backup verificado (SHA-256) — objeto y hora: 
- [ ] ID de deployment actual de Vercel: 
- [ ] ID de deployment actual de Render: 

## Tras el merge

- SHA fusionado: 
- Nuevo deployment de Vercel: 
- Nuevo deployment de Render (migraciones OK): 

- [ ] Smoke: `/up`, `/api/health`, login, páginas públicas, robots/sitemap, 401/404, portales con ID inexistente
- [ ] PWA se actualiza sin perder estado
- [ ] Workflow `Production smoke` verde; vigilancia 24 h

## Rollback

- [ ] No ha hecho falta
- [ ] Ejecutado (motivo, deployment restaurado, resultado): 

<!-- Sin `migrate:rollback`: corregir hacia delante o restaurar el backup. -->

# Blue Planet Recontact — Changelog

## v1.1.1 — Compatibilidad Foundry VTT 13.351

### Correcciones de API v13

**Críticas (causaban errores de carga):**
- `item-skill-sheet.js`: `extends ItemSheet` → `extends foundry.appv1.sheets.ItemSheet`
- `item-sheet.mjs`: `extends ItemSheet` → `extends foundry.appv1.sheets.ItemSheet`
- `item.js`, `reactive-updates.js`: `instanceof ItemSheet` → `instanceof foundry.appv1.sheets.ItemSheet`

**Globales sin namespace (deprecados en v13):**
- `duplicate()` → `foundry.utils.duplicate()` en `actor-sheet.js`
- `TextEditor.getDragEventData()` → `foundry.applications.ux.TextEditor.getDragEventData()` en `actor-sheet.js`
- `renderTemplate()` → `foundry.applications.handlebars.renderTemplate()` en `item-ammunition-sheet.mjs`
- `ChatMessage.create()` → `foundry.documents.ChatMessage.create()` (6 archivos)
- `Item.create()` → `foundry.documents.Item.create()` (3 archivos)
- `Actor.create()` → `foundry.documents.Actor.create()` (macro + sheets)

**Handlebars helpers:**
- Añadido helper `ne` (alias de `neq`) — se usaba en plantillas pero no estaba registrado

**system.json:**
- `compatibility.verified` actualizado a `13.351`
- `packFolders` — añadidos `vehicles` y `remotes` al grupo de contenido

### Funcionalidades añadidas en esta sesión
- Fichas de actor Vehicle y Remote completas con drag-and-drop de tripulación/operadores
- Tab Capacities (Biomods + Cyberware) en fichas NPC y Cetacean
- Scrollbars aqua/teal consistentes en todos los tabs de todas las fichas (solución flex universal)
- Los remotes pueden arrastrarse a fichas de vehículo desde cualquier tab activo

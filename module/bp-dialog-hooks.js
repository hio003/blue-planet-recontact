/**
 * Blue Planet Recontact — Dialog Theme Hooks
 *
 * Inyecta la clase `bpr-themed` en todos los diálogos de Foundry
 * (nativos y del sistema) para aplicarles el esquema visual unificado.
 *
 * Compatible con Foundry v13: AppV1 (jQuery) y AppV2 (DOM puro).
 * No altera comportamiento — solo CSS.
 */

/**
 * Normaliza el elemento raíz de la ventana desde el argumento html que
 * reciben los hooks. En AppV1 es un jQuery wrapper; en AppV2 es un HTMLElement.
 * Devuelve siempre el HTMLElement del .window-app / contenedor raíz.
 */
function getRootElement(htmlArg) {
  // AppV1: html es jQuery — obtenemos el [0]
  let el = (htmlArg && htmlArg[0]) ? htmlArg[0] : htmlArg;
  if (!el) return null;

  // Subir al contenedor padre .window-app (si html apunta al window-content)
  const root =
    el.closest?.('.window-app') ??
    el.closest?.('.app') ??
    el.closest?.('.dialog') ??
    el;

  return root;
}

/**
 * Añade la clase bpr-themed al elemento raíz si no la tiene ya
 * y si no es una ficha de actor/item BP (que ya tiene su propio tema).
 */
function applyTheme(root) {
  if (!root) return;
  // No tematizar las fichas propias del sistema (ya están estilizadas)
  if (root.classList.contains('blue-planet-recontact')) return;
  // No doble-aplicar
  if (root.classList.contains('bpr-themed')) return;
  root.classList.add('bpr-themed');
}

/**
 * Registra los hooks. Llamar una sola vez desde `Hooks.once('init', ...)`.
 */
export function registerDialogThemeHooks() {

  // ── AppV1: Dialog.render ──────────────────────────────────────────────
  // Captura TODOS los diálogos creados con `new Dialog(...)` incluidos los nativos
  Hooks.on('renderDialog', (app, html) => {
    applyTheme(getRootElement(html));
  });

  // ── AppV1: otras Applications (settings, folder, etc.) ───────────────
  Hooks.on('renderApplication', (app, html) => {
    applyTheme(getRootElement(html));
  });

  // ── Hooks específicos para ventanas nativas de Foundry v13 ───────────
  // Algunos no disparan renderApplication — los listamos explícitamente
  const HOOKS_TO_THEME = [
    // Creación de documentos
    'renderDocumentCreate',
    'renderFolderCreate',
    // Configuración de documentos
    'renderFolderConfig',
    'renderTokenConfig',
    'renderPrototypeTokenConfig',
    'renderSceneConfig',
    'renderActorConfig',
    'renderItemConfig',
    'renderActiveEffectConfig',
    'renderUserConfig',
    'renderMacroConfig',
    'renderCombatConfig',
    'renderSheetConfig',
    // Settings
    'renderSettingsConfig',
    // Otros
    'renderImagePopout',
    'renderConfirmDialog',     // v13 DialogV2 confirm
    'renderPackageDeleteDialog',
    'renderDocumentOwnershipConfig',
    // v13 AppV2 nativo
    'renderDocumentSheetV2',
  ];

  for (const hookName of HOOKS_TO_THEME) {
    Hooks.on(hookName, (app, html) => {
      applyTheme(getRootElement(html));
    });
  }

  // ── MutationObserver: captura diálogos de AppV2 nativo ───────────────
  // DialogV2 y ApplicationV2 nativas de Foundry v13 a veces no disparan
  // hooks de renderApplication. El observer lo captura todo.
  Hooks.once('ready', () => {
    const container = document.getElementById('ui-windows') ?? document.body;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          // Ventana directa
          if (node.classList.contains('window-app') ||
              node.classList.contains('application') ||
              node.classList.contains('dialog')) {
            applyTheme(node);
          }
          // Ventanas anidadas (raro, pero por si acaso)
          node.querySelectorAll('.window-app, .application.dialog')
            .forEach(win => applyTheme(win));
        }
      }
    });

    observer.observe(container, { childList: true, subtree: false });

    // Aplicar también a ventanas ya abiertas en el momento del ready
    container.querySelectorAll('.window-app, .application').forEach(win => {
      applyTheme(win);
    });

    console.log('BluePlanet | Dialog theme hooks activos ✓');
  });
}

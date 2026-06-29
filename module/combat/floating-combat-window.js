/**
 * Blue Planet Floating Combat Window — v4
 *
 * Drag: mousedown en header → mousemove/mouseup en document (capture phase).
 * Posición calculada desde this._px/_py, nunca desde getBoundingClientRect
 * (que puede devolver coordenadas afectadas por transforms de CSS).
 *
 * Combat API: compatible con Foundry v13.
 */

export class FloatingCombatWindow {

  constructor() {
    this.el        = null;
    this.isVisible = false;
    this.combat    = null;
    this._px       = 80;
    this._py       = 80;
    this._dragging = false;
    this._ox       = 0;
    this._oy       = 0;
    this._mmHandler = null;
    this._muHandler = null;
  }

  /* ── API pública ─────────────────────────────────────────────────────── */

  async toggle() {
    this.isVisible ? this.hide() : await this.show();
  }

  async show() {
    if (this.el) this._destroy();
    this.combat = game.combat;
    if (!this.combat) {
      try {
        this.combat = await Combat.create({
          scene: game.scenes.active?.id,
          active: true
        });
      } catch (err) {
        ui.notifications.error('Failed to create combat: ' + err.message);
        return;
      }
    }
    this._create();
    this.isVisible = true;
  }

  hide() {
    if (this.el) this.el.style.display = 'none';
    this.isVisible = false;
  }

  /* ── Construcción DOM ────────────────────────────────────────────────── */

  _destroy() {
    // Limpiar drag listeners globales
    if (this._mmHandler) { document.removeEventListener('mousemove', this._mmHandler, true); this._mmHandler = null; }
    if (this._muHandler) { document.removeEventListener('mouseup',   this._muHandler, true); this._muHandler = null; }
    this._dragging = false;
    this.el?.remove();
    this.el = null;
    this.isVisible = false;
  }

  _create() {
    this.el = document.createElement('div');
    this.el.id        = 'bp-floating-combat-window';
    this.el.className = 'bp-floating-combat-window';

    // Posicionamiento fijo. SIN animation, SIN transform.
    // transition solo en propiedades visuales — NUNCA en left/top.
    this.el.style.cssText = `
      position: fixed;
      left: ${this._px}px;
      top:  ${this._py}px;
      width: 320px;
      z-index: 99999;
      user-select: none;
      opacity: 0.75;
      transition: opacity 0.2s, box-shadow 0.2s, border-color 0.2s;
    `;

    this.el.innerHTML = this._buildHTML();
    document.body.appendChild(this.el);

    this._attachDrag();
    this._attachButtons();
    this._attachHover();
  }

  /* ── HTML ────────────────────────────────────────────────────────────── */

  _buildHTML() {
    const c       = this.combat;
    const round   = c?.round ?? 0;
    const turn    = (c?.turn ?? 0) + 1;
    const started = !!c?.started;

    return `
      <div class="bp-window-header">
        <div class="bp-window-title">
          <span class="bp-title-icon">⚔️</span>
          <span class="bp-title-text">Combat Tracker</span>
          <span class="bp-round-info">R${round} T${turn}</span>
        </div>
        <div class="bp-window-controls">
          <button class="bp-minimize-btn" title="Minimize">−</button>
          <button class="bp-close-btn" title="Close">×</button>
        </div>
      </div>

      <div class="bp-combatants-container">
        <div class="bp-combatants-header">
          <span class="bp-header-initiative">Initiative</span>
          <span class="bp-header-name">Combatant</span>
          <span class="bp-header-actions">Actions</span>
        </div>
        <div class="bp-combatants-list" id="bp-combatants-list">
          ${this._buildCombatantsHTML()}
        </div>
      </div>

      <div class="bp-combat-controls-section">
        <div class="bp-initiative-controls">
          <button class="bp-control-btn bp-roll-all-initiative">
            <i class="fas fa-dice-d10"></i> Roll Initiative
          </button>
          <button class="bp-control-btn bp-new-round">
            <i class="fas fa-redo"></i> New Round
          </button>
        </div>
        <div class="bp-turn-controls">
          <button class="bp-control-btn bp-prev-turn">
            <i class="fas fa-arrow-left"></i> Prev Turn
          </button>
          <button class="bp-control-btn bp-next-turn">
            <i class="fas fa-arrow-right"></i> Next Turn
          </button>
        </div>
        <div class="bp-combat-state-controls">
          ${started
            ? `<button class="bp-control-btn bp-end-combat" style="background:rgba(200,40,40,0.5)">
                 <i class="fas fa-stop"></i> End Combat
               </button>`
            : `<button class="bp-control-btn bp-begin-combat" style="background:rgba(40,180,40,0.4)">
                 <i class="fas fa-play"></i> Begin Combat
               </button>`
          }
        </div>
      </div>

      <div class="bp-window-footer">
        <div class="bp-footer-info">
          Blue Planet Combat • ${c?.combatants?.size ?? 0} combatants
        </div>
      </div>
    `;
  }

  _buildCombatantsHTML() {
    if (!this.combat?.combatants?.size)
      return '<div class="bp-no-combatants">No combatants in combat</div>';

    const sorted = Array.from(this.combat.combatants).sort((a, b) =>
      ((b.initiative ?? -Infinity) - (a.initiative ?? -Infinity))
    );
    const activeId = this.combat.combatant?.id;

    return sorted.map(cb => {
      const isActive = cb.id === activeId;
      const img  = cb.img || cb.actor?.img || 'icons/svg/mystery-man.svg';
      const name = cb.name || cb.actor?.name || 'Unknown';
      const init = cb.initiative ?? '—';
      return `
        <div class="bp-combatant ${isActive ? 'bp-active-turn' : ''}"
             data-combatant-id="${cb.id}">
          <div class="bp-combatant-initiative">
            <span class="bp-initiative-value">${init}</span>
          </div>
          <div class="bp-combatant-info">
            <div class="bp-combatant-image"><img src="${img}" alt="${name}"/></div>
            <div class="bp-combatant-name">
              <span class="bp-name-text">${name}</span>
              <div class="bp-combatant-status">
                ${cb.defeated ? '<span class="bp-status-defeated">💀 Defeated</span>' : ''}
                ${cb.hidden   ? '<span class="bp-status-hidden">👁️ Hidden</span>'    : ''}
              </div>
            </div>
          </div>
          <div class="bp-combatant-actions">
            <button class="bp-action-btn bp-roll-initiative"
                    data-combatant-id="${cb.id}" title="Roll Initiative">
              <i class="fas fa-dice-d10"></i>
            </button>
            <button class="bp-action-btn bp-select-combatant"
                    data-combatant-id="${cb.id}" title="Select Token">🎯</button>
          </div>
          ${isActive ? '<div class="bp-active-glow"></div>' : ''}
        </div>`;
    }).join('');
  }

  /* ── Drag ────────────────────────────────────────────────────────────── */

  _attachDrag() {
    const header = this.el.querySelector('.bp-window-header');
    if (!header) return;

    header.style.cursor = 'move';

    header.addEventListener('mousedown', (e) => {
      // Ignorar botones y click derecho
      if (e.button !== 0)              return;
      if (e.target.closest('button')) return;

      e.preventDefault();
      e.stopPropagation();

      this._dragging = true;
      // Calcular offset desde la posición almacenada — no de getBoundingClientRect
      // (que puede estar afectada por transforms de CSS aplicados por Foundry)
      this._ox = e.clientX - this._px;
      this._oy = e.clientY - this._py;

      this.el.style.transition = 'none';
      this.el.style.opacity    = '0.9';
      this.el.style.cursor     = 'grabbing';
      document.body.style.cursor = 'grabbing';

      // mousemove y mouseup en capture para recibirlos antes que Foundry/PIXI
      this._mmHandler = (ev) => {
        if (!this._dragging) return;
        this._px = ev.clientX - this._ox;
        this._py = ev.clientY - this._oy;
        this.el.style.left = this._px + 'px';
        this.el.style.top  = this._py + 'px';
      };

      this._muHandler = () => {
        this._dragging = false;
        document.removeEventListener('mousemove', this._mmHandler, true);
        document.removeEventListener('mouseup',   this._muHandler, true);
        this._mmHandler = null;
        this._muHandler = null;
        document.body.style.cursor = '';
        this.el.style.transition = 'opacity 0.2s, box-shadow 0.2s, border-color 0.2s';
        this.el.style.opacity    = '0.75';
        this.el.style.cursor     = '';
      };

      document.addEventListener('mousemove', this._mmHandler, true);
      document.addEventListener('mouseup',   this._muHandler, true);
    });
  }

  /* ── Hover ───────────────────────────────────────────────────────────── */

  _attachHover() {
    this.el.addEventListener('mouseenter', () => {
      if (this._dragging) return;
      this.el.style.opacity     = '1';
      this.el.style.boxShadow   = '0 0 50px rgba(255,100,0,0.8), 0 12px 40px rgba(0,0,0,0.9)';
      this.el.style.borderColor = '#ff6400';
    });
    this.el.addEventListener('mouseleave', () => {
      if (this._dragging) return;
      this.el.style.opacity     = '0.75';
      this.el.style.boxShadow   = '';
      this.el.style.borderColor = '';
    });
  }

  /* ── Botones ─────────────────────────────────────────────────────────── */

  _attachButtons() {
    const q = (sel) => this.el.querySelector(sel);

    q('.bp-minimize-btn')?.addEventListener('click', () => this._minimize());
    q('.bp-close-btn')?.addEventListener('click',    () => this.hide());

    q('.bp-roll-all-initiative')?.addEventListener('click', async () => {
      if (!this.combat) return;
      try {
        const { BluePlanetInitiative } = await import('./initiative.js');
        await BluePlanetInitiative.rollInitiativeForAll(this.combat);
      } catch (err) { ui.notifications.error('Failed to roll initiative: ' + err.message); }
      this.refresh();
    });

    q('.bp-new-round')?.addEventListener('click', async () => {
      if (!this.combat) return;
      try { await this.combat.nextRound(); }
      catch (err) { ui.notifications.error('Failed: ' + err.message); }
      this.refresh();
    });

    q('.bp-prev-turn')?.addEventListener('click', async () => {
      try { await this.combat?.previousTurn(); } catch {}
      this.refresh();
    });

    q('.bp-next-turn')?.addEventListener('click', async () => {
      try { await this.combat?.nextTurn(); } catch {}
      this.refresh();
    });

    // Begin Combat — en v13 es combat.startCombat()
    q('.bp-begin-combat')?.addEventListener('click', async () => {
      if (!this.combat) return;
      try {
        await this.combat.startCombat();
        ui.notifications.info('Combat started!');
      } catch (err) {
        // Fallback: algunos builds de v13 usan update directo
        try {
          await this.combat.update({ round: 1, turn: 0 });
        } catch (e2) {
          ui.notifications.error('Failed to start combat: ' + err.message);
          return;
        }
      }
      this.fullRebuild();
    });

    // End Combat — en v13 es combat.endCombat() que internamente lo elimina
    q('.bp-end-combat')?.addEventListener('click', async () => {
      if (!this.combat) return;
      const confirmed = await Dialog.confirm({
        title: 'End Combat',
        content: '<p>Are you sure you want to end the combat encounter?</p>',
        defaultYes: false
      });
      if (!confirmed) return;
      try {
        await this.combat.endCombat();
      } catch (err) {
        // Fallback: eliminar directamente
        try { await this.combat.delete(); } catch {}
      }
      this.hide();
    });

    this._attachCombatantButtons();
  }

  _attachCombatantButtons() {
    this.el.querySelectorAll('.bp-roll-initiative').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.combatantId;
        if (!id || !this.combat) return;
        try {
          const { BluePlanetInitiative } = await import('./initiative.js');
          await BluePlanetInitiative.rollInitiativeForCombatant(this.combat, id);
        } catch (err) { console.error(err); }
        this.refresh();
      });
    });

    this.el.querySelectorAll('.bp-select-combatant').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.combatantId;
        const cb = this.combat?.combatants?.get(id);
        if (cb?.token?.object) {
          cb.token.object.control();
          canvas.animatePan({ x: cb.token.x, y: cb.token.y });
        }
      });
    });
  }

  /* ── Actualización ───────────────────────────────────────────────────── */

  /** Refresca solo la lista de combatants y el round/turn (sin re-crear el DOM raíz) */
  refresh() {
    if (!this.el || !this.combat) return;

    const info = this.el.querySelector('.bp-round-info');
    if (info) info.textContent = `R${this.combat.round ?? 0} T${(this.combat.turn ?? 0) + 1}`;

    const list = this.el.querySelector('#bp-combatants-list');
    if (list) {
      list.innerHTML = this._buildCombatantsHTML();
      this._attachCombatantButtons();
    }

    const footer = this.el.querySelector('.bp-footer-info');
    if (footer) footer.textContent = `Blue Planet Combat • ${this.combat.combatants?.size ?? 0} combatants`;
  }

  /** Reconstruye el HTML interno completo (ej. tras Begin/End combat) */
  fullRebuild() {
    if (!this.el || !this.combat) return;
    const savedPos = { l: this.el.style.left, t: this.el.style.top };
    this.el.innerHTML = this._buildHTML();
    this.el.style.left = savedPos.l;
    this.el.style.top  = savedPos.t;
    this._attachDrag();
    this._attachButtons();
    this._attachHover();
  }

  _minimize() {
    const container = this.el.querySelector('.bp-combatants-container');
    const controls  = this.el.querySelector('.bp-combat-controls-section');
    const footer    = this.el.querySelector('.bp-window-footer');
    const btn       = this.el.querySelector('.bp-minimize-btn');
    const collapsed = container?.style.display === 'none';
    [container, controls, footer].forEach(el => {
      if (el) el.style.display = collapsed ? '' : 'none';
    });
    if (btn) btn.textContent = collapsed ? '−' : '+';
  }
}

/* ── Instancia global ────────────────────────────────────────────────────── */

window.blueplanetFloatingCombat = new FloatingCombatWindow();

Hooks.on('updateCombat', (combat) => {
  const w = window.blueplanetFloatingCombat;
  if (!w.isVisible || w.combat?.id !== combat.id) return;
  w.combat = combat;
  // Si cambió el estado started, reconstruir (para cambiar botón Begin/End)
  if ('started' in (combat._source ?? {})) {
    w.fullRebuild();
  } else {
    w.refresh();
  }
});

Hooks.on('deleteCombat', (combat) => {
  const w = window.blueplanetFloatingCombat;
  if (w.combat?.id === combat.id) w.hide();
});

document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
    e.preventDefault();
    await window.blueplanetFloatingCombat.toggle().catch(console.error);
  }
});

/**
 * Remote / CICADA Sheet — Blue Planet Recontact
 * Operadores válidos: character, npc, cetacean.
 *
 * Drop handling: toda la ficha acepta drops (dropSelector "form").
 * Al añadir un operador se cambia automáticamente al tab Operators.
 */
export class BluePlanetRemoteSheet extends foundry.appv1.sheets.ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "actor", "remote"],
      template: "systems/blue-planet-recontact/templates/actor/actor-remote-sheet.hbs",
      width: 860,
      height: 640,
      resizable: true,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "operators" }],
      dragDrop: [{ dragSelector: null, dropSelector: "form" }]
    });
  }

  get template() {
    return "systems/blue-planet-recontact/templates/actor/actor-remote-sheet.hbs";
  }

  // Tipos aceptados como operadores
  static ACCEPTED_OPERATOR_TYPES = ["character", "npc", "cetacean"];

  // ── Data ───────────────────────────────────────────────────────────────────

  async getData(options) {
    const context = await super.getData(options);
    context.system = context.data.system;
    context.flags  = context.data.flags;

    if (!context.system.operators_list) context.system.operators_list = [];

    context.system.operators_list = context.system.operators_list
      .map(op => this._enrichOperator(op))
      .filter(Boolean);

    context.hasCetaceanOperator = context.system.operators_list.some(op => op.type === "cetacean");

    context.remoteTypeLabel = {
      cetacean:      "Cetacean Hover Remote",
      cicada:        "CICADA",
      combat:        "Combat Remote",
      surveillance:  "Surveillance Remote",
      constellation: "Remote Constellation",
      triage:        "Triage Remote",
      simulacrum:    "Simulacrum",
      power_shell:   "Power Shell",
      custom:        "Custom Remote"
    }[context.system.remote_type] || "Remote";

    return context;
  }

  _enrichOperator(op) {
    if (!op?.actorId) return null;
    const actor = game.actors?.get(op.actorId);
    if (!actor) return op;
    return {
      actorId:    op.actorId,
      name:       actor.name,
      img:        actor.img || "icons/svg/mystery-man.svg",
      type:       actor.type,
      isCetacean: actor.type === "cetacean"
    };
  }

  // ── Listeners ──────────────────────────────────────────────────────────────

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find(".remove-operator").on("click", ev => {
      this._removeOperator(ev.currentTarget.dataset.actorId);
    });

    html.find(".open-actor").on("click", ev => {
      const actor = game.actors?.get(ev.currentTarget.dataset.actorId);
      if (actor) actor.sheet?.render(true);
    });

    // Feedback visual al arrastrar
    const form = html[0];
    const getZone = () => html.find(".droppable-operators")[0];

    form.addEventListener("dragover", ev => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "copy";
      getZone()?.classList.add("drag-over");
    });

    form.addEventListener("dragleave", ev => {
      if (!form.contains(ev.relatedTarget)) {
        getZone()?.classList.remove("drag-over");
      }
    });

    form.addEventListener("drop", () => {
      getZone()?.classList.remove("drag-over");
    });
  }

  // ── Drop ──────────────────────────────────────────────────────────────────

  async _onDrop(event) {
    event.preventDefault();
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch(e) { return; }

    if (data.type === "Actor") return this._onDropActor(event, data);
    return super._onDrop(event);
  }

  async _onDropActor(event, data) {
    let actor;
    try {
      actor = await fromUuid(data.uuid);
    } catch(e) {
      if (data.id) actor = game.actors?.get(data.id);
    }
    if (!actor) return;

    if (actor.id === this.actor.id) return;

    if (!BluePlanetRemoteSheet.ACCEPTED_OPERATOR_TYPES.includes(actor.type)) {
      ui.notifications?.warn(
        `"${actor.name}" (${actor.type}) cannot operate a remote. ` +
        `Accepted types: ${BluePlanetRemoteSheet.ACCEPTED_OPERATOR_TYPES.join(", ")}.`
      );
      return;
    }

    const current = foundry.utils.duplicate(this.actor.system.operators_list || []);
    if (current.find(op => op.actorId === actor.id)) {
      ui.notifications?.info(`${actor.name} is already an operator of ${this.actor.name}.`);
      return;
    }

    current.push({
      actorId: actor.id,
      name:    actor.name,
      img:     actor.img || "icons/svg/mystery-man.svg",
      type:    actor.type
    });

    // ── Auto-rename and auto-type on first operator drop ──────────────────
    const updateData = { "system.operators_list": current };
    const isFirstOperator = (this.actor.system.operators_list || []).length === 0;

    if (isFirstOperator) {
      // Rename: "[Character Name]'s Remote"
      updateData.name = `${actor.name}'s Remote`;

      // Auto-detect remote type from operator species / actor type
      const detectedType = BluePlanetRemoteSheet._detectRemoteType(actor);
      if (detectedType) updateData["system.remote_type"] = detectedType;
    }

    await this.actor.update(updateData);

    // Switch to operators tab
    this._tabs?.[0]?.activate("operators");

    // Notification
    if (isFirstOperator && updateData["system.remote_type"]) {
      const LABELS = {
        cetacean:      "Cetacean Hover Remote",
        cicada:        "CICADA",
        combat:        "Combat Remote",
        surveillance:  "Surveillance Remote",
        constellation: "Remote Constellation",
        triage:        "Triage Remote",
        simulacrum:    "Simulacrum",
        power_shell:   "Power Shell",
        custom:        "Custom Remote"
      };
      const typeLabel = LABELS[updateData["system.remote_type"]] || updateData["system.remote_type"];
      ui.notifications?.info(
        `${actor.name} assigned as operator. Remote renamed to "${updateData.name}" and type set to ${typeLabel}.`
      );
    } else {
      const msg = actor.type === "cetacean"
        ? `🐋 ${actor.name} assigned as cetacean operator of ${this.actor.name}.`
        : `${actor.name} assigned as operator of ${this.actor.name}.`;
      ui.notifications?.info(msg);
    }
  }

  /**
   * Determine the most appropriate remote_type from the operator actor.
   *
   * Mapping (Blue Planet Recontact canon):
   *   cetacean actor type          → cetacean (Hover Remote)
   *   species "cetacean"           → cetacean
   *   species "cicada"             → cicada   (CICADA aquatic sled)
   *   species "power shell" / mhd  → power_shell
   *   species "simulacr" / "analog"→ simulacrum
   *   species "recode"             → simulacrum (Recoded use analogs)
   *   species "modified" / "gvam"  → combat
   *   npc (no special species)     → surveillance
   *   human character (default)    → combat
   *
   * @param {Actor} actor  The operator being dropped
   * @returns {string}     remote_type value
   */
  static _detectRemoteType(actor) {
    if (actor.type === "cetacean") return "cetacean";

    const species = (actor.system?.species || "").toLowerCase().trim();

    if (species.includes("cetacean"))                           return "cetacean";
    if (species.includes("cicada"))                             return "cicada";
    if (species.includes("power shell") ||
        species.includes("power_shell") ||
        species.includes("mhd"))                                return "power_shell";
    if (species.includes("simulacr") || species.includes("analog")) return "simulacrum";
    if (species.includes("recode"))                             return "simulacrum";
    if (species.includes("modified") ||
        species.includes("gvam")     ||
        species.includes("genetek"))                            return "combat";

    // NPC without special species → surveillance
    if (actor.type === "npc") return "surveillance";

    // Human character default → combat remote
    return "combat";
  }

  // ── Mutaciones ─────────────────────────────────────────────────────────────

  async _removeOperator(actorId) {
    const current = (this.actor.system.operators_list || []).filter(op => op.actorId !== actorId);
    await this.actor.update({ "system.operators_list": current });
  }
}

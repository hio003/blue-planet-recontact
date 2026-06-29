/**
 * Vehicle Sheet — Blue Planet Recontact
 * Handles ground, aquatic (surface + submersible), aerial, and space vehicles.
 * Crew/passengers can be any Actor type: character, npc, cetacean, remote.
 *
 * Drop handling: the entire sheet form is the drop target so drops work from
 * any tab. On successful drop the sheet auto-switches to the Crew tab.
 */
export class BluePlanetVehicleSheet extends foundry.appv1.sheets.ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "actor", "vehicle"],
      template: "systems/blue-planet-recontact/templates/actor/actor-vehicle-sheet.hbs",
      width: 900,
      height: 680,
      resizable: true,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "crew" }],
      // "form" = toda la ficha es zona de drop, funciona desde cualquier tab activo
      dragDrop: [{ dragSelector: null, dropSelector: "form" }]
    });
  }

  get template() {
    return "systems/blue-planet-recontact/templates/actor/actor-vehicle-sheet.hbs";
  }

  // Tipos de actor aceptados como tripulación
  static ACCEPTED_CREW_TYPES = ["character", "npc", "cetacean", "remote"];

  // ── Data ───────────────────────────────────────────────────────────────────

  async getData(options) {
    const context = await super.getData(options);
    context.system = context.data.system;
    context.flags  = context.data.flags;

    if (!context.system.crew_members)    context.system.crew_members    = [];
    if (!context.system.passengers_list) context.system.passengers_list = [];

    context.system.crew_members = context.system.crew_members
      .map(m => this._enrichMember(m))
      .filter(Boolean);

    context.vehicleTypeLabel = {
      ground:      "Vehículo Terrestre",
      aquatic:     "Embarcación de Superficie",
      submersible: "Sumergible",
      aerial:      "Aeronave",
      space:       "Nave Espacial"
    }[context.system.vehicle_type] || "Vehículo";

    context.attackNA = (context.system.maneuvers?.attack ?? -99) <= -90;

    return context;
  }

  _enrichMember(member) {
    if (!member?.actorId) return null;
    const actor = game.actors?.get(member.actorId);
    if (!actor) return member;
    return {
      actorId: member.actorId,
      name:    actor.name,
      img:     actor.img || "icons/svg/mystery-man.svg",
      type:    actor.type,
      role:    member.role || ""
    };
  }

  // ── Listeners ──────────────────────────────────────────────────────────────

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find(".remove-crew").on("click", ev => {
      this._removeMember(ev.currentTarget.dataset.actorId);
    });

    html.find(".open-actor").on("click", ev => {
      const actor = game.actors?.get(ev.currentTarget.dataset.actorId);
      if (actor) actor.sheet?.render(true);
    });

    html.find(".crew-role-input").on("change", ev => {
      this._updateMemberRole(ev.currentTarget.dataset.actorId, ev.currentTarget.value);
    });

    // Feedback visual al arrastrar sobre la ficha (resalta el drop-zone)
    const form = html[0];
    const getZone = () => html.find(".droppable-crew")[0];

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
    // Resolver el actor desde uuid o id
    let actor;
    try {
      actor = await fromUuid(data.uuid);
    } catch(e) {
      if (data.id) actor = game.actors?.get(data.id);
    }
    if (!actor) return;

    // No puede añadirse a sí mismo
    if (actor.id === this.actor.id) return;

    // Solo tipos permitidos
    if (!BluePlanetVehicleSheet.ACCEPTED_CREW_TYPES.includes(actor.type)) {
      ui.notifications?.warn(
        `"${actor.name}" (${actor.type}) no puede ser tripulación. ` +
        `Se aceptan: ${BluePlanetVehicleSheet.ACCEPTED_CREW_TYPES.join(", ")}.`
      );
      return;
    }

    // Ya está a bordo
    const current = foundry.utils.duplicate(this.actor.system.crew_members || []);
    if (current.find(m => m.actorId === actor.id)) {
      ui.notifications?.info(`${actor.name} ya está a bordo de ${this.actor.name}.`);
      return;
    }

    // Añadir a la tripulación
    current.push({
      actorId: actor.id,
      name:    actor.name,
      img:     actor.img || "icons/svg/mystery-man.svg",
      type:    actor.type,
      role:    actor.type === "remote" ? "Remote embarcado" : ""
    });

    await this.actor.update({ "system.crew_members": current });

    // Cambiar automáticamente al tab de tripulación para ver el resultado
    this._tabs?.[0]?.activate("crew");

    const msg = actor.type === "remote"
      ? `📡 Remote "${actor.name}" embarcado en ${this.actor.name}.`
      : `${actor.name} añadido a la tripulación de ${this.actor.name}.`;
    ui.notifications?.info(msg);
  }

  // ── Mutaciones de tripulación ──────────────────────────────────────────────

  async _removeMember(actorId) {
    const current = (this.actor.system.crew_members || []).filter(m => m.actorId !== actorId);
    await this.actor.update({ "system.crew_members": current });
  }

  async _updateMemberRole(actorId, role) {
    const current = foundry.utils.duplicate(this.actor.system.crew_members || []);
    const member = current.find(m => m.actorId === actorId);
    if (member) {
      member.role = role;
      await this.actor.update({ "system.crew_members": current });
    }
  }
}

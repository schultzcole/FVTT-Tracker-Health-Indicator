const full = "Uninjured";
const dead = "Dead";
const unconscious = "Unconscious";
const healthStatus = ["Bloodied", "Injured"];

const maxColor = hexToRGB(0x77BB55);
const minColor = hexToRGB(0xAA1111);

// Inject HP indicator in combat tracker
Hooks.on("renderCombatTracker", (combatTracker, html) => {

    // Add "namespacing" class to #combat
    html.addClass("combat-hp-indicator");

    const combatants = html.find(".combatant");

    if (!combatants.find(".token-resource").length) {
        combatants.find(".token-name").after(`<div class="token-resource"></div>`)
    }

    combatants.each((i, el) => {
        const jel = $(el);
        const tokenId = jel.attr("data-token-id");
        const token = canvas.tokens.get(tokenId);
        if (!token) return;
        const { value, max } = token.actor.data.data.attributes.hp;
        const { label, color } = getHealthStatus(value, max, token.actor.data.type === "character");
        const textColor = rgbToHexString(color);
        const strokeColor = rgbToHexString(subtractFromColor(color, .4));
        jel.find(".token-resource").prepend(`<span class="hp-indicator" style="color: ${textColor}; -webkit-text-stroke-color: ${strokeColor}">${label}</span>`);
    });
});

// Rerender combat tracker if linked token HP value changes
Hooks.on("updateActor", (actor, data) => {
    const hpValue = getProperty(data, "data.attributes.hp.value");
    if (hpValue === undefined || hpValue === null) return;

    const linkedTokens = actor.getActiveTokens(true);
    const allCombatants = game.combats.combats.flatMap(combat => combat.combatants);
    const actorInCombat = allCombatants.some(c => linkedTokens.map(t => t.id).includes(c.tokenId));
    if (actorInCombat) ui.combat.render(true);
});

// Rerender combat tracker if unlinked token HP value changes
Hooks.on("updateToken", (_, tokenData, diff) => {
    const hpValue = getProperty(diff, "actorData.data.attributes.hp.value");
    if (hpValue === undefined || hpValue === null) return;

    const allCombatants = game.combats.combats.flatMap(combat => combat.combatants);
    const tokenInCombat = allCombatants.some(c => c.tokenId === tokenData._id);
    if (tokenInCombat) ui.combat.render(true);
})

function getHealthStatus(currentHP, maxHP, isPC) {
    if (currentHP === 0) {
        return { label: isPC ? unconscious : dead, color: minColor };
    } else if (currentHP === maxHP) {
        return { label: full, color: maxColor };
    } else {
        const frac = currentHP / maxHP;
        const index = Math.ceil(healthStatus.length * frac) - 1;
        const colorPct = (index + .5) / healthStatus.length;
        return { label: healthStatus[index], color: blendColor(minColor, maxColor, colorPct) };
    }
}

function blendColor(min, max, p) {
    return [...Array(3).keys()].map(i => (1 - p) * min[i] + p * max[i]);
}

function subtractFromColor(color, sub) {
    return color.map(v => Math.max(v - sub, 0));
}

function rgbToHexString(rgb) {
    return "#" + rgb.map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}

// Base recipe anchored on banana = 220 g. Every other amount is this base
// scaled by (weighed banana / 220). Numbers match the original spreadsheet.
const ANCHOR_BANANA_G = 220;
const KCAL_BASE = 720;
const INGREDIENTS = [
  { name: "Egg whites",     base: 180, unit: "g",   decimals: 0 },
  { name: "Protein powder", base: 33,  unit: "g",   decimals: 0 },
  { name: "Rolled oats",    base: 65,  unit: "g",   decimals: 0 },
  { name: "Cocoa powder",   base: 15,  unit: "g",   decimals: 0 },
  { name: "Cinnamon",       base: 1,   unit: "tsp", decimals: 2 },
];

function scaleRecipe(bananaGrams) {
  const factor = bananaGrams / ANCHOR_BANANA_G;
  return {
    items: INGREDIENTS.map(ingredient => ({ ...ingredient, amount: ingredient.base * factor })),
    kcal: KCAL_BASE * factor,
  };
}

const rowsEl = document.getElementById("rows");
const kcalEl = document.getElementById("kcal");
const input = document.getElementById("banana");

function render() {
  const grams = parseFloat(input.value) || 0;
  const { items, kcal } = scaleRecipe(grams);
  rowsEl.innerHTML = items.map(ingredient => `
    <div class="row">
      <span class="name">${ingredient.name}</span>
      <span class="amt">${ingredient.amount.toFixed(ingredient.decimals)}<span class="u">${ingredient.unit}</span></span>
    </div>`).join("");
  kcalEl.textContent = Math.round(kcal);
}

input.addEventListener("input", render);
render();

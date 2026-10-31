/** Original bundled instruction transcripts. Parent maps these exact keys to local audio. */
export const QUALITY_GUIDANCE = {
  "cards-go-fish":
    "Look at your cards. Ask for a number or picture you already hold. Your partner gives you every card of that rank. If they have none, go fish: draw a card. Four of the same rank make a book. The most books wins. Watch the turn story to see what changed. In step pace, tap Let the computer play when you are ready.",
  "cards-crazy-eights":
    "Look at the top card in the middle. Play a card with the same number, the same picture rank, or the chosen suit. An eight is wild: choose the suit for the next player. If nothing matches, draw one. Play that new card if it fits, or finish your turn. Empty your hand to win.",
  "lab-space":
    "This is Earth, seen from above the North Pole. The Sun stays on the left. Tap the coral place dot or Turn Earth to move it one step. Watch the dot travel from darkness into sunlight. Eight steps make one full turn. Can you find sunrise and sunset?",
  "lab-oceans":
    "Build an ocean food chain with picture tiles. Start with sunlight. Then choose the tiny living thing that uses sunlight to make food. Choose who eats it next. Arrows show energy moving from food to eater. Tap a tile to add it, or remove the last link to try again.",
  "lab-animals":
    "This animal needs a suitable home. Look at its picture, then choose a habitat picture. Think about food, water, shelter, and room to grow. A wrong choice gives a clue. Six animals need your help. Tap Listen again whenever you need the directions.",
  "lab-weather":
    "Follow one drop of water. Tap a picture on the water wheel to choose what happens next. Warm water can become invisible vapor. Cooling vapor can make tiny cloud drops. Try a path through rain and the ground, then back to the sea. Only the next possible steps are lit up.",
  "lab-world":
    "Follow a clue around the world. North is up on this map. Tap a numbered map pin or the matching place button. The selected place lights up. Look for Guam, then follow four more clues. The map stretches some shapes so we can see them together.",
  "term-phytoplankton":
    "Phytoplankton. Say: fight oh plank ton. These tiny drifters use sunlight to make food. The leaf and sunshine picture reminds us that energy starts with the Sun.",
  "term-zooplankton":
    "Zooplankton. Say: zoe oh plank ton. These tiny drifting animals eat other living things. Some eat phytoplankton. Small fish can eat them.",
  "term-habitat":
    "Habitat means the place where a living thing gets what it needs: food, water, shelter, and space. A nest is only one small part of a bird’s habitat.",
  "term-water-vapor":
    "Water vapor is water in its invisible gas form. The white cloud you can see is made of tiny liquid drops or ice, not invisible vapor.",
} as const;
export type GuidanceKey = keyof typeof QUALITY_GUIDANCE;

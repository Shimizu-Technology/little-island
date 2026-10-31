import playV25Speech from "../../scripts/learn/play-v25.json";
/** Parent can bundle these as local audio. Text remains the complete offline instruction source. */
export const mysteryInstructions = {
  "mystery-welcome":
    "Welcome to Picnic Island. Touch a place to walk there. The island waits while you read in practice. Finish the garden, telescope, picnic basket and boat ropes. One islander secretly makes mischief.",
  "mystery-crew":
    "You are crew. Finish four jobs together, or find the trickster at a meeting. A ribbon does not take you out. You can unwrap it and keep helping. Watch who is nearby and check your private notebook.",
  "mystery-mischief":
    "You make mischief. Make three ribbon tricks before the crew finishes its jobs or finds you. You must be close to someone and wait between tricks. At the pump you can turn off the water. Everyone keeps playing.",
  "mystery-garden":
    "Three garden beds need water. Touch each thirsty plant. A tall green plant has enough water. You can water them in any order.",
  "mystery-stars":
    "Turn the telescope pointer left or right until it meets the glowing star. Then touch Align. Find all three stars. Look at the picture; this is not a memory test.",
  "mystery-picnic":
    "Put water, fruit and bread into the basket. Touch each picture. The packed food stays in the basket. Any order works.",
  "mystery-dock":
    "Connect the boat to shore. Choose a rope on the boat, then its matching shore cleat. Match the shape as well as the color. Connect all three ropes.",
  "mystery-pump-v25": playV25Speech["mystery-pump-v25"],
  "mystery-meeting":
    "Talk about what you saw. Your notebook holds private observations. When you are ready, vote for one player or skip. A crew member who gets a wrong vote can still help with jobs. Only the parent can start a nearby rematch.",
} as const;

import { chamoruWords } from "../content/chamoru";
import type { GrowthQuestion, GrowthTracks } from "./types";

/** Finite, eagerly built banks: prompts, contexts and explanations can all be enumerated offline. */
const choose = (
  id: string, skill: string, skillLabel: string, prompt: string, context: string,
  labels: readonly [string, string, string], explanation: string,
): GrowthQuestion => ({
  id, skill, skillLabel, prompt, context,
  choices: labels.map((label) => ({ value: label, label })), answer: labels[0], explanation,
});

function build(
  id: string, skill: string, skillLabel: string, prompt: string, context: string,
  pieces: readonly [string, string], extras: readonly [string, string], explanation: string,
): GrowthQuestion {
  return {
    id, skill, skillLabel, prompt, context, explanation,
    scene: { kind: "word" },
    // Deliberately not in answer order. Every piece is unique, including distractors.
    tiles: [extras[0], pieces[1], extras[1], pieces[0]],
    answer: pieces.join("|"),
    choices: [pieces, [pieces[0], extras[0]], [extras[1], pieces[1]]].map((parts) => ({
      value: parts.join("|"), label: parts.join(""),
    })),
  };
}

const soundStretch: GrowthQuestion[] = [
  build("sb-s-sunset", "read.compound-parts", "Join meaningful word parts", "Join two word parts to name this time of day.", "The sun is going down, and day is changing to night.", ["sun", "set"], ["sit", "sand"], "Sun and set join to make sunset, the time when the sun goes down."),
  build("sb-s-raincoat", "read.compound-parts", "Join meaningful word parts", "Join two word parts to name this kind of coat.", "Lina needs a coat made to keep rain off her clothes.", ["rain", "coat"], ["boat", "run"], "Rain and coat join to make raincoat, a coat worn in rain."),
  build("sb-s-bedtime", "read.compound-parts", "Join meaningful word parts", "Join two word parts to name this time.", "We put away our books. It is time to go to bed.", ["bed", "time"], ["tame", "bad"], "Bed and time join to make bedtime, the time to go to bed."),
  build("sb-s-picnic", "read.two-syllables", "Build two-syllable words", "Build the two-syllable word for this meal outdoors.", "We took a basket of lunch to eat on a blanket under a tree.", ["pic", "nic"], ["net", "pan"], "The two spoken parts of picnic are pic and nic. Join them in that order."),
  build("sb-s-jumping", "read.base-endings", "Keep the base and add an ending", "Use jump and an ending to tell what is happening now.", "The frog is in the middle of a jump over a small rock.", ["jump", "ing"], ["ed", "help"], "Keep the base jump and add ing. Jumping tells what the frog is doing now."),
  build("sb-s-helped", "read.base-endings", "Keep the base and add an ending", "Use help and an ending to tell what happened yesterday.", "Ben gave us help with the bags yesterday. Ben ____ carry the bags.", ["help", "ed"], ["ing", "jump"], "Help plus ed makes helped. The ending fits something that already happened."),
  build("sb-s-boats", "read.base-endings", "Keep the base and add an ending", "Use boat and an ending to name more than one.", "One boat is by the dock. Two more arrive. Now there are three ____.", ["boat", "s"], ["ed", "coat"], "Boat plus s makes boats. The s ending fits more than one boat."),
  build("sb-s-wishes", "read.base-endings", "Keep the base and add an ending", "Use wish and an ending to name more than one.", "Each child made a wish. Together they made many ____.", ["wish", "es"], ["s", "wash"], "Wish ends in sh. Add es to make the plural wishes."),
  choose("sb-s-playful", "read.word-families", "Find a shared base word", "Which word belongs to the play word family?", "Played and playing both keep the base word play.", ["playful", "plate", "place"], "Playful keeps the whole base play. Plate and place do not have that base."),
  choose("sb-s-helper", "read.word-families", "Find a shared base word", "Which word names a person who helps?", "We need someone to help carry the empty baskets.", ["helper", "helped", "helping"], "Helper is help plus er. Here er names a person who does the helping."),
  choose("sb-s-unpack", "read.word-families", "Find a shared base word", "Which word means to take things out after you pack them?", "The trip is over. The clothes are still packed in a bag.", ["unpack", "packing", "packed"], "Unpack keeps pack and adds un at the front. Here un means to reverse the packing."),
  choose("sb-s-repaint", "read.word-families", "Find a shared base word", "Which word means to paint again?", "The bench was painted last year. Its paint is worn, so we will paint it again.", ["repaint", "painter", "painting"], "Repaint keeps paint and adds re, meaning again."),
];

const soundDeep: GrowthQuestion[] = [
  build("sb-d-rabbit", "read.two-syllables", "Read across two syllables", "Build the two-syllable animal name that fits the clue.", "This small furry animal has long ears and moves in hops.", ["rab", "bit"], ["bet", "rib"], "Rabbit has two syllables, rab and bit. The two b letters meet where these parts join."),
  build("sb-d-sunlit", "read.two-syllables", "Read across two syllables", "Join two parts to describe the bright path.", "One path is lit by the sun. The other path is dark under a roof.", ["sun", "lit"], ["let", "sand"], "Sun and lit join to make sunlit, meaning lit by the sun."),
  build("sb-d-basket", "read.two-syllables", "Read across two syllables", "Build the two-syllable word that completes the sentence.", "Mina carried fruit in a woven ____ with a handle.", ["bas", "ket"], ["kit", "bus"], "Basket has two spoken parts, bas and ket. Read across the joined parts."),
  build("sb-d-napkin", "read.two-syllables", "Read across two syllables", "Build the two-syllable word that completes the sentence.", "At the dinner table, Kai wiped his mouth with a paper ____.", ["nap", "kin"], ["ken", "nip"], "Napkin has two syllables, nap and kin. The pieces join without changing their letters."),
  build("sb-d-hopping", "read.changed-endings", "Notice spelling changes at endings", "Prepare hop and add ing to tell what is happening now.", "The rabbit moves in little jumps. It is ____ across the grass.", ["hopp", "ing"], ["hop", "ed"], "Hop ends in one vowel and one final consonant. Double the p before ing: hopp plus ing makes hopping."),
  build("sb-d-making", "read.changed-endings", "Notice spelling changes at endings", "Prepare make and add ing to tell what is happening now.", "Dad is busy with paper and string. He is ____ a kite.", ["mak", "ing"], ["make", "ed"], "Drop the silent e from make before adding ing. Mak plus ing makes making."),
  build("sb-d-babies", "read.changed-endings", "Notice spelling changes at endings", "Prepare baby and add an ending to name more than one.", "One baby was asleep. Two other ____ were awake.", ["bab", "ies"], ["baby", "s"], "In baby, a consonant comes before y. Change that y to ies to make babies: bab plus ies."),
  build("sb-d-stopped", "read.changed-endings", "Notice spelling changes at endings", "Prepare stop and add ed to tell what happened yesterday.", "The bus had to stop at the gate yesterday. It ____ there at noon.", ["stopp", "ed"], ["stop", "ing"], "Stop ends in one vowel and one final consonant. Double p before ed: stopp plus ed makes stopped."),
  choose("sb-d-reusable", "read.family-meaning", "Use the base word to explain meaning", "Which word describes a bag that can be used again?", "We keep this bag and use it on many trips, instead of throwing it away.", ["reusable", "useless", "unused"], "Reusable belongs to the use family. Re means again, and able means it can be done."),
  choose("sb-d-careless", "read.family-meaning", "Use the base word to explain meaning", "Which word describes acting without care?", "A child rushed and left the lid open without checking it.", ["careless", "careful", "caring"], "Careless keeps the base care. The ending less means without; careful means with care."),
  choose("sb-d-unhelpful", "read.family-meaning", "Use the base word to explain meaning", "Which word describes advice that does not help?", "The advice gave no useful steps for fixing the torn kite.", ["unhelpful", "helpful", "helper"], "Helpful means giving help. Adding un makes unhelpful, meaning not helpful."),
  choose("sb-d-rereading", "read.family-meaning", "Use the base word to explain meaning", "Which word describes reading the same page again right now?", "A sentence was puzzling, so I am reading that page again.", ["rereading", "reader", "unread"], "Rereading keeps read, adds re for again, and ing for the action happening now."),
];

const direction = (id: string, skill: string, label: string, context: string, prompt: string, options: readonly [string, string, string], explanation: string) =>
  ({ ...choose(id, skill, label, prompt, context, options, explanation), scene: { kind: "passage" as const } });
const whichStretch = [
  direction("wo-s-bag", "read.conditions", "Follow two conditions", "Three bags are on a bench: a large red bag, a small red bag, and a small blue bag.", "Choose the bag that is red and small.", ["The small red bag", "The large red bag", "The small blue bag"], "The small red bag meets both conditions. Each other bag meets only one."),
  direction("wo-s-cup", "read.conditions", "Follow two conditions", "A green cup has a lid. A blue cup has a lid. Another green cup has no lid.", "Choose the green cup with a lid.", ["The green cup with a lid", "The blue cup with a lid", "The green cup without a lid"], "Both green and with a lid must be true of the same cup."),
  direction("wo-s-line", "read.conditions", "Follow two conditions", "In a line, Ana stands first, Bo stands second, and Cy stands third.", "Choose the person after Ana but before Cy.", ["Bo", "Ana", "Cy"], "Bo is second, after Ana and before Cy."),
  direction("wo-s-umbrella", "read.reference", "Follow a reference", "Nia put the umbrella beside the boots. Then she opened it.", "What does it refer to?", ["The umbrella", "The boots", "Nia"], "The umbrella is the single thing Nia can open here. It refers back to the umbrella."),
  direction("wo-s-siblings", "read.reference", "Follow a reference", "Milo and Tess carried a box together. They set it under the table.", "Who does they refer to?", ["Milo and Tess", "Only Milo", "The box and table"], "They refers to the two people, Milo and Tess. It refers to the box."),
  direction("wo-s-bottle", "read.reference", "Follow a reference", "Ari lent Jo a bottle. Jo filled the bottle and returned it to Ari.", "Who gets the bottle at the end?", ["Ari", "Jo", "Someone unnamed"], "Returned it to Ari tells us the bottle goes back to Ari."),
  direction("wo-s-empty", "read.negation", "Notice what is ruled out", "One basket holds shells. One holds leaves. One is empty.", "Choose the basket that does not hold anything.", ["The empty basket", "The shell basket", "The leaf basket"], "Does not hold anything means empty. Both other baskets contain something."),
  direction("wo-s-dry", "read.negation", "Notice what is ruled out", "The striped towel is wet. The plain towel is dry. The dotted towel is wet.", "Choose a towel that is not wet.", ["The plain towel", "The striped towel", "The dotted towel"], "The plain towel is dry, so it is not wet."),
  direction("wo-s-inside", "read.negation", "Notice what is ruled out", "A ball is in the box. A book is on the box. A toy is in the box.", "Choose the thing that is not inside the box.", ["The book", "The ball", "The toy"], "The book is on the box. The ball and toy are inside it."),
  direction("wo-s-spill", "read.cause-effect", "Connect a cause and its result", "Kai bumped a full cup. Water spilled onto the table.", "Why did the water spill?", ["Kai bumped the cup", "The table was dry", "Kai filled a basket"], "Bumping the full cup caused its water to spill."),
  direction("wo-s-shade", "read.cause-effect", "Connect a cause and its result", "The bench in the sun felt hot. Lea moved to a bench in the shade to cool down.", "Why did Lea move?", ["To find a cooler place", "To make the sun hotter", "To wet the bench"], "Lea wanted to cool down, so she left the hot bench for shade."),
  direction("wo-s-paper", "read.cause-effect", "Connect a cause and its result", "Wind blew loose papers off a table. Sam put a stone on the remaining papers.", "What is the stone meant to do?", ["Keep the papers on the table", "Make more wind", "Help the papers fly"], "The wind moved loose papers. A stone holds the remaining papers in place."),
];
const whichDeep = [
  direction("wo-d-package", "read.conditions-deep", "Combine conditions and exclusions", "Package A is small, blue, and open. Package B is small, blue, and closed. Package C is large, blue, and closed.", "Choose the small blue package that is not open.", ["Package B", "Package A", "Package C"], "B is small and blue, and closed means not open. A is open; C is large."),
  direction("wo-d-shelf", "read.conditions-deep", "Combine conditions and exclusions", "Top shelf: a red cup and a blue bowl. Bottom shelf: a blue cup and a red bowl.", "Choose the cup that is not on the top shelf.", ["The blue cup", "The red cup", "The red bowl"], "The blue cup is a cup on the bottom shelf. The red bowl is not a cup."),
  direction("wo-d-turn", "read.conditions-deep", "Combine conditions and exclusions", "In order, the players are Pia, Ren, Sol, and Tia.", "Choose the player after Ren but not last.", ["Sol", "Tia", "Pia"], "Sol follows Ren and is third. Tia is last, so the second condition rules Tia out."),
  direction("wo-d-they", "read.reference-deep", "Track references across sentences", "The twins brought a kite to Lani. Lani thanked them, then put it in the shed.", "What went into the shed?", ["The kite", "The twins", "The thanks"], "It refers to the kite. Them refers to the twins, who brought it."),
  direction("wo-d-owner", "read.reference-deep", "Track references across sentences", "Mara gave Ivo a hat to hold. Ivo placed it beside Mara's bag. Later Mara put the hat on.", "Whose bag was beside the hat?", ["Mara's bag", "Ivo's bag", "An unnamed person's bag"], "The sentence names Mara's bag. Holding the hat does not make the bag Ivo's."),
  direction("wo-d-these", "read.reference-deep", "Track references across sentences", "Paz sorted shells into a cracked pile and a smooth pile. Pointing to the smooth pile, Paz said, 'These can go on the display.'", "Which shells does these mean?", ["The smooth shells", "The cracked shells", "All shells in both piles"], "Paz points to the smooth pile while saying these. The pointing fixes the reference."),
  direction("wo-d-neither", "read.negation-deep", "Use more than one exclusion", "The red box is wet. The green box is torn. The blue box is dry and whole.", "Choose the box that is neither wet nor torn.", ["The blue box", "The green box", "The red box"], "Neither wet nor torn rules out both problems. Only the blue box is dry and whole."),
  direction("wo-d-unless", "read.negation-deep", "Use more than one exclusion", "The rule says to keep the plant outside in dry weather, but bring it inside if rain starts. Rain starts before lunch.", "What follows the rule now?", ["Bring the plant inside", "Leave the plant outside", "Wait outside until tomorrow"], "Rain is the exception to leaving the plant outside. The rule says to bring it inside when rain starts, and that has happened."),
  direction("wo-d-notboth", "read.negation-deep", "Use more than one exclusion", "Plan A needs scissors and glue. Plan B needs only glue. Plan C needs only scissors. You have glue but no scissors.", "Which plan can you finish with what you have?", ["Plan B", "Plan A", "Plan C"], "B needs only the glue you have. Both A and C need scissors, which are missing."),
  direction("wo-d-drain", "read.cause-effect-deep", "Reason through a chain of events", "Leaves blocked a drain. Rainwater stayed on the path. After the leaves were removed, the water flowed away.", "What best explains why the water flowed away?", ["Removing the leaves opened the drain", "The leaves made more rain", "The path moved uphill"], "The blockage was removed before the water flowed away. That opened its route through the drain."),
  direction("wo-d-ice", "read.cause-effect-deep", "Reason through a chain of events", "A frozen juice pop was left in a warm bag. Later it was liquid. The wrapper had no holes.", "Which explanation fits all the clues?", ["Warmth melted the frozen pop", "A hole let the juice escape", "The juice turned into a stone"], "The bag was warm and the pop changed from frozen to liquid. The unbroken wrapper rules out a leak."),
  direction("wo-d-bell", "read.cause-effect-deep", "Reason through a chain of events", "When the bell rings, the class lines up. Today the bell is broken, so the teacher claps. The class lines up after the clap.", "What took the bell's place today?", ["The teacher's clap", "A working bell", "The end of the line"], "Today the clap served as the signal. The class lined up after hearing it."),
];

type TaleItem = readonly [key: string, skill: "sequence" | "inference" | "motive" | "evidence", prompt: string, options: readonly [string, string, string], evidence: string, reason: string];
const taleLabels = { sequence: "Put story events in order", inference: "Infer from story clues", motive: "Explain a character's reason", evidence: "Find evidence in the passage" };
function story(id: string, title: string, passage: string, items: readonly TaleItem[]): GrowthQuestion[] {
  return items.map(([key, skill, prompt, options, evidence, reason]) => ({
    ...choose(`${id}-${key}`, `read.tale-${skill}`, taleLabels[skill], prompt, passage, options,
      `The passage says, "${evidence}" ${reason}`),
    scene: { kind: "passage", labels: [title] },
  }));
}
const talesStretch = [
  ...story("tt-s-seeds", "A place for the seeds", "Mina planted seeds in a pot. She put the pot by a sunny window and watered the soil. After three days, no green shoots had appeared. Mina wanted to empty the pot, but Dad asked her to wait. Two days later, tiny shoots rose from the soil. Mina smiled and left the pot by the window.", [
    ["sequence", "sequence", "What happened after Dad asked Mina to wait?", ["Tiny shoots appeared", "Mina planted the seeds for the first time", "Mina emptied the pot"], "Two days later, tiny shoots rose from the soil.", "The shoots came after the extra waiting."],
    ["motive", "motive", "Why did Dad ask Mina to wait?", ["The seeds might need more time", "The pot had no seeds", "He wanted her to throw the pot away"], "Two days later, tiny shoots rose from the soil.", "The later shoots support Dad's reason for giving the seeds more time."],
    ["evidence", "evidence", "Which detail shows that Mina was pleased at the end?", ["Mina smiled", "No shoots had appeared after three days", "Dad asked her to wait"], "Mina smiled and left the pot by the window.", "Her smile is evidence of being pleased."],
  ]),
  ...story("tt-s-kite", "The kite string", "Leo and Tia took a kite to the field. The wind lifted the kite, but its string caught on a low branch. Leo pulled hard, and the string grew tighter. Tia asked him to stop pulling. She lifted the string off the branch with a long stick. Then Leo let out more string, and the kite rose again.", [
    ["sequence", "sequence", "What happened just before the kite rose again?", ["Leo let out more string", "They left home for the field", "The string caught for the first time"], "Then Leo let out more string, and the kite rose again.", "Letting out string immediately preceded the kite rising again."],
    ["inference", "inference", "Did pulling hard solve the problem?", ["No; the string became tighter", "Yes; it freed the string at once", "Yes; it broke the branch"], "Leo pulled hard, and the string grew tighter.", "Pulling made the caught string tighter; the stick later freed it."],
    ["motive", "motive", "Why did Tia use a long stick?", ["To free the string from the branch", "To cut the kite into pieces", "To make the wind stop"], "She lifted the string off the branch with a long stick.", "The stick helped her reach and lift the caught string."],
  ]),
  ...story("tt-s-book", "A dry place for a book", "Rain began while Niko was reading on the porch. Drops blew onto the edge of his book. Niko closed the book and carried it inside. He wiped the cover with a towel, then put the book on a dry shelf. His sister asked to read it. Niko pointed to the shelf and said she could take it after lunch.", [
    ["sequence", "sequence", "What did Niko do before wiping the cover?", ["He carried the book inside", "He put the book on the dry shelf", "He lent the book after lunch"], "Niko closed the book and carried it inside.", "He went inside before he used the towel."],
    ["inference", "inference", "Why was the shelf a safer place for the book?", ["It was dry and inside", "It was out in the rain", "It had a bowl of water on it"], "He wiped the cover with a towel, then put the book on a dry shelf.", "The inside shelf kept the book away from the drops on the porch."],
    ["evidence", "evidence", "Which detail shows that the rain could reach the book on the porch?", ["Drops blew onto the edge of his book", "His sister asked to read it", "Niko pointed to the shelf"], "Drops blew onto the edge of his book.", "This directly shows rain reaching the book."],
  ]),
  ...story("tt-s-crab", "A quiet look", "Aya spotted a small crab beside a rock pool. She called loudly to her brother, and the crab slipped under a rock. Aya sat still and lowered her voice. Her brother sat beside her without splashing the water. After a while, the crab came out. They watched it walk across the sand and left it where it lived.", [
    ["inference", "inference", "What helped the children get another look at the crab?", ["Waiting quietly without splashing", "Calling more loudly", "Chasing it under the rock"], "Aya sat still and lowered her voice.", "Quiet waiting came before the crab reappeared; they did not chase it."],
    ["motive", "motive", "Why did Aya lower her voice?", ["To avoid startling the crab again", "To call someone farther away", "To stop her brother from sitting down"], "She called loudly to her brother, and the crab slipped under a rock.", "Her quieter behavior responds to the crab hiding after the loud call."],
    ["evidence", "evidence", "Which detail shows they did not take the crab home?", ["They left it where it lived", "Aya spotted a small crab", "Her brother sat beside her"], "They watched it walk across the sand and left it where it lived.", "Leaving it in its home supports that conclusion."],
  ]),
];
const talesDeep = [
  ...story("tt-d-sign", "The moved sign", "The class made a sign for a seedling beside the path. On Monday, people kept stepping close to the seedling even though the sign said to walk around it. Jo noticed the sign faced the fence. Jo turned it toward the path, without changing any words. On Tuesday, people slowed down and walked around the plant. The leaves stayed uncrushed. Jo decided to check which way the sign faced each morning.", [
    ["inference", "inference", "What most likely kept people from following the sign on Monday?", ["They could not easily see its words from the path", "The words were changed on Tuesday", "The seedling had already been moved away"], "Jo noticed the sign faced the fence.", "Turning the same words toward walkers helped them notice the message."],
    ["motive", "motive", "Why did Jo plan a daily check?", ["To keep the sign facing people on the path", "To replace the seedling every day", "To make the fence taller"], "Jo decided to check which way the sign faced each morning.", "The sign's direction had made a difference, so Jo wanted to keep it useful."],
    ["evidence", "evidence", "Which detail best supports that turning the sign helped?", ["On Tuesday people walked around the plant", "The class made a sign", "There was a fence"], "On Tuesday, people slowed down and walked around the plant.", "The changed behavior after the turn is stronger evidence than the sign simply existing."],
  ]),
  ...story("tt-d-drum", "The soft drum", "Rae practiced a drum for the school show. In the empty room, the beat sounded loud and clear. At rehearsal, a friend reading a poem could not be heard over the drum. Rae first moved farther back, but the poem was still hard to hear. Then Rae tapped more softly and played only between the lines. The friend finished the poem without repeating a line. Rae wrote a reminder on the music: leave room for the words.", [
    ["sequence", "sequence", "Which change did Rae try after moving farther back failed?", ["Playing more softly between the lines", "Moving farther back for the first time", "Practicing alone in the empty room"], "Then Rae tapped more softly and played only between the lines.", "This change follows the unsuccessful move in the passage."],
    ["motive", "motive", "What does leave room for the words mean in Rae's reminder?", ["Let listeners hear the poem as well as the drum", "Leave an empty chair for a book", "Stop the friend from reading"], "At rehearsal, a friend reading a poem could not be heard over the drum.", "The reminder addresses the sound problem by giving the spoken lines space."],
    ["evidence", "evidence", "Which detail best shows the final change worked?", ["The friend finished without repeating a line", "The empty room made the beat clear", "Rae wrote on the music"], "The friend finished the poem without repeating a line.", "The reader's successful performance supports that the drum no longer covered the poem."],
  ]),
  ...story("tt-d-map", "Two routes", "Noa drew a map from the gate to the picnic table. The short route crossed a low patch of grass. The longer route followed a raised path. Before the picnic, heavy rain left a puddle across the grass. Noa's cousin arrived pushing a cart of food. Noa crossed out the short route on the cousin's map and traced the raised path instead. They arrived with dry wheels. On a dry day, Noa would still use the short route when walking alone.", [
    ["sequence", "sequence", "What happened before Noa changed the cousin's map?", ["Rain left a puddle across the grass", "They arrived with dry wheels", "The cousin finished eating"], "Before the picnic, heavy rain left a puddle across the grass.", "The puddle existed before Noa changed the route."],
    ["inference", "inference", "Why could the longer route be the better choice that day?", ["It avoided the wet grass for the food cart", "It was always the shortest route", "It led away from the picnic table"], "The longer route followed a raised path.", "The raised path avoided the puddle across the lower grass, and the cart arrived dry."],
    ["evidence", "evidence", "Which detail shows Noa did not think the short route was always bad?", ["Noa would use it when walking alone on a dry day", "Noa crossed it out on the cousin's map", "The cousin pushed a cart"], "On a dry day, Noa would still use the short route when walking alone.", "That stated exception shows the choice depends on conditions."],
  ]),
  ...story("tt-d-tray", "The missing pieces", "A puzzle club counted twelve edge pieces on a tray. After the tray was carried outside, only ten remained. Ben said someone must have taken two. Sela noticed that one corner of the tray was bent and a piece lay under the step. She looked along the route and found another beside the door. Sela straightened the tray and carried it level on the next trip. All twelve pieces arrived. Ben said he should have looked for clues before blaming anyone.", [
    ["sequence", "sequence", "Which happened between finding the piece under the step and the next trip?", ["Sela found another piece beside the door", "Ben counted only ten for the first time", "The club first counted twelve on the tray"], "She looked along the route and found another beside the door.", "Sela found the second piece before fixing and carrying the tray again."],
    ["inference", "inference", "Which explanation best fits the missing pieces?", ["They fell from the bent tray along the route", "Someone certainly hid them in a locked box", "The puzzle began with only ten pieces"], "Sela noticed that one corner of the tray was bent and a piece lay under the step.", "Finding both pieces along the route supports a spill rather than Ben's unsupported blame."],
    ["motive", "motive", "Why did Sela straighten the tray and carry it level?", ["To keep pieces from falling on the next trip", "To make two more pieces disappear", "To prove the puzzle had no edges"], "Sela straightened the tray and carried it level on the next trip.", "She changed the likely cause of the spill, and all twelve arrived afterward."],
  ]),
];

/** Choices are source IDs and verbatim terms, never newly composed CHamoru phrases.
 * Contexts/prompts/explanations are English, so narration can leave all CHamoru labels unspoken.
 */
function language(id: string, context: string, prompt: string, ids: readonly [string, string, string], reason: string): GrowthQuestion {
  const words = ids.map((wordId) => {
    const word = chamoruWords.find((entry) => entry.id === wordId);
    if (!word) throw new Error(`Unknown reviewed vocabulary: ${wordId}`);
    return word;
  });
  return {
    id, skill: `ch.context-${words[0].category.replaceAll("_", "-")}`, skillLabel: `Use ${words[0].category.replaceAll("_", " ")} in context`,
    prompt, context, scene: { kind: "language" },
    choices: words.map((word) => ({ value: word.id, label: word.term })), answer: words[0].id,
    explanation: `The matching choice means ${words[0].english.toLowerCase()}. ${reason}`,
  };
}
const languageStretch = [
  language("ha-s-thanks", "A neighbor hands back the hat you dropped. You want to show gratitude.", "Which response fits?", ["greetings.thank_you", "greetings.goodbye", "greetings.hello"], "Gratitude calls for thank you."),
  language("ha-s-leaving", "Your visit is over and you are leaving your aunt's home.", "Which response fits leaving?", ["greetings.goodbye", "greetings.thank_you", "greetings.good_morning"], "Goodbye fits the end of a visit."),
  language("ha-s-morning", "It is morning. You want a greeting that specifically names that time of day.", "Which greeting fits?", ["greetings.good_morning", "greetings.hello", "greetings.goodbye"], "A general hello does not specifically name the morning."),
  language("ha-s-water", "At lunch, you are choosing the label for a jug of drinking water.", "Which word belongs on that jug?", ["food.water", "food.soup_stew", "food.cooked_rice"], "The jug contains water, rather than soup or rice."),
  language("ha-s-rice", "You are helping label the cooked rice in a serving bowl.", "Which word fits this food?", ["food.cooked_rice", "food.egg", "food.fish"], "The described food is cooked rice."),
  language("ha-s-mango", "The fruit basket has a section marked mango in English.", "Which word matches that section?", ["food.mango", "food.green_banana", "food.green_coconut"], "These are different fruits; this section is for mango."),
  language("ha-s-blue", "You need a label for the blue team flag. The other flags are red and green.", "Which color word fits your flag?", ["colors.blue", "colors.red", "colors.green"], "The blue flag belongs to the described team."),
  language("ha-s-white", "A paint pot contains white paint. You need the matching color word for its label.", "Which color word matches?", ["colors.white", "colors.black", "colors.yellow"], "The paint is white, rather than black or yellow."),
  language("ha-s-three", "There are three empty places at the table. You are choosing a number card for that count.", "Which number matches?", ["numbers.three", "numbers.two", "numbers.four"], "Count the three places and match three."),
  language("ha-s-mother", "A photo label needs the word for your mother, rather than your father or sibling.", "Which family word fits?", ["family.mother", "family.father", "family.sibling"], "The label describes your mother."),
  language("ha-s-ear", "A drawing labels the part of the body used for hearing: the ear.", "Which word belongs there?", ["body_parts.ear", "body_parts.eye", "body_parts.nose"], "The drawing points to the ear."),
  language("ha-s-hand", "You are matching the English label hand on a body chart.", "Which word includes that meaning?", ["body_parts.hand", "body_parts.foot", "body_parts.mouth"], "This word includes the meaning hand. The other words name different body parts."),
];
const languageDeep = [
  language("ha-d-thanks", "You already greeted a neighbor. Now the neighbor helps carry a heavy bag. Your next response should express thanks, rather than another greeting.", "Which response best fits this moment?", ["greetings.thank_you", "greetings.hello", "greetings.good_morning"], "The new event is receiving help, so gratitude fits this turn."),
  language("ha-d-hello", "It is afternoon and a cousin has just arrived. You want a general hello, not a morning-specific greeting or a farewell.", "Which response meets all three clues?", ["greetings.hello", "greetings.good_morning", "greetings.goodbye"], "A general hello fits an arrival without naming morning."),
  language("ha-d-leaving", "You thanked the host after lunch. Now you are walking out of the gate and want a farewell, rather than repeating thanks.", "Which response fits the next turn?", ["greetings.goodbye", "greetings.thank_you", "greetings.hello"], "The turn is now a farewell at departure."),
  language("ha-d-soup", "You are sorting food labels. This bowl contains broth with vegetables, not plain drinking water or cooked rice.", "Which word names the kind of dish in the bowl?", ["food.soup_stew", "food.water", "food.cooked_rice"], "The soup, broth, or stew choice names this kind of dish. The other choices mean water and cooked rice."),
  language("ha-d-coconut", "Two baskets hold green fruit. One holds green bananas; the other holds green coconuts. You need the label for the second basket.", "Which word fits the second basket?", ["food.green_coconut", "food.green_banana", "food.mango"], "Second refers to the green coconut basket, not the banana basket."),
  language("ha-d-eggs", "A shopping card lists fish, chicken, and eggs. The fish and chicken are packed already. You need the word for the remaining item.", "Which word matches the item still needed?", ["food.egg", "food.fish", "food.chicken"], "Egg matches the food still needed. The fish and chicken are already packed."),
  language("ha-d-yellow", "Three ribbons are yellow, red, and black. The directions say to pick the yellow ribbon and leave the other two.", "Which label belongs to the chosen ribbon?", ["colors.yellow", "colors.red", "colors.black"], "The directions select yellow and exclude red and black."),
  language("ha-d-seven", "You need ten cups altogether. Three are already on the table. Choose a number card for the seven cups still needed.", "Which number card matches the remaining cups?", ["numbers.seven", "numbers.three", "numbers.ten"], "Ten minus three leaves seven; the card should name the remaining amount."),
  language("ha-d-eight", "Eight children are coming. Two adults will join them, but the card you are making counts children only.", "Which number belongs on the children-only card?", ["numbers.eight", "numbers.two", "numbers.ten"], "The requested group contains eight children. The two adults are excluded."),
  language("ha-d-grandfather", "A family display has separate spaces for grandmother, grandfather, and father. The first and third labels are finished; you need the grandfather entry.", "Which family word fits the unfinished space?", ["family.grandfather_guello", "family.grandmother_guella", "family.father"], "The unfinished space is specifically for grandfather."),
  language("ha-d-children", "A display has one photo of a single child and another photo of several children. You are labeling the group photo, not the single child.", "Which word names children in the plural?", ["family.children", "family.child", "family.family"], "Children matches the group photo. Child would match the photo of just one child."),
  language("ha-d-foot", "On a body chart, the marker is below the ankle. It points to a foot, not to a hand or the head.", "Which word includes the marked part?", ["body_parts.foot", "body_parts.hand", "body_parts.head"], "This word includes foot. The clues rule out hand and head."),
];

export const literacyTracks: GrowthTracks = {
  "sound-boat": {
    stretch: { label: "Word parts and endings", description: "Build two-syllable words, keep a base word, and notice what endings mean.", questions: soundStretch },
    deep: { label: "Spelling changes and word families", description: "Read across syllables, build changed endings, and use word parts to explain meaning.", questions: soundDeep },
  },
  "which-one": {
    stretch: { label: "Directions and references", description: "Follow two clues, track a reference, notice not, and connect causes with results.", questions: whichStretch },
    deep: { label: "Linked clues and exceptions", description: "Combine conditions and exclusions, follow references, and reason through event chains.", questions: whichDeep },
  },
  "turtle-tales": {
    stretch: { label: "Story clues and reasons", description: "Read four short stories to order events, infer, explain motives, and find evidence.", questions: talesStretch },
    deep: { label: "Evidence across a passage", description: "Use four longer stories to compare explanations and support inferences with the text.", questions: talesDeep },
  },
  "hafa-adai": {
    stretch: { label: "Words for everyday moments", description: "Choose familiar words for greetings, food, family, colors, numbers, and body parts.", questions: languageStretch },
    deep: { label: "Context and careful choices", description: "Follow several English clues to choose a word or response for an everyday situation.", questions: languageDeep },
  },
};

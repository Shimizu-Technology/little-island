export type WorldId = "space" | "oceans" | "animals" | "weather" | "world";
export interface ExploreTopic {
  id: string;
  world: WorldId;
  title: string;
  short: string;
  deeper: string;
  question: string;
  related: string[];
  illustration: string;
  sources: { title: string; url: string }[];
  review: { checkedOn: string; method: string; audience: string };
}
export const WORLDS: {
  id: WorldId;
  title: string;
  invitation: string;
  color: string;
  tint: string;
  activity: string;
}[] = [
  {
    id: "space",
    title: "Space",
    invitation: "Travel from our spinning Earth to distant stars.",
    color: "#56538D",
    tint: "#EEEAF6",
    activity: "Day & night lab",
  },
  {
    id: "oceans",
    title: "Oceans",
    invitation: "Follow the water. Meet a whole underwater world.",
    color: "#276D85",
    tint: "#E1F0F3",
    activity: "Build a food chain",
  },
  {
    id: "animals",
    title: "Animals",
    invitation: "Tiny wings, clever disguises, and remarkable homes.",
    color: "#43734C",
    tint: "#E7F0DF",
    activity: "Habitat detective",
  },
  {
    id: "weather",
    title: "Weather",
    invitation: "Make a cloud and follow a drop of water.",
    color: "#936025",
    tint: "#F8EED8",
    activity: "Water journey lab",
  },
  {
    id: "world",
    title: "Guam & Our World",
    invitation: "Start close to home. Find connections across Earth.",
    color: "#986048",
    tint: "#F6E8DD",
    activity: "Map expedition",
  },
];
const review = {
  checkedOn: "2026-10-19",
  method: "Agent fact check against the listed primary educational source; original child-facing explanation.",
  audience: "Ages 7+ with optional grown-up reading",
};
const source = (title: string, url: string) => ({ title, url });
const nasa = (path: string) => source("NASA Science", `https://science.nasa.gov/${path}`);
const place = (path: string) => source("NASA Space Place", `https://spaceplace.nasa.gov/${path}/en/`);
const noaa = (path: string) =>
  source("NOAA National Ocean Service", `https://oceanservice.noaa.gov/facts/${path}.html`);
const t = (
  world: WorldId,
  id: string,
  title: string,
  short: string,
  deeper: string,
  question: string,
  illustration: string,
  sources: ExploreTopic["sources"],
  related: string[]
): ExploreTopic => ({
  world,
  id,
  title,
  short,
  deeper,
  question,
  illustration,
  sources,
  related,
  review: { ...review },
});
export const TOPICS: ExploreTopic[] = [
  t(
    "space",
    "sun",
    "Is the Sun a star?",
    "Yes! The Sun is our nearest star. It sends light and warmth across space to Earth. Other stars look much smaller because they are so far away.",
    "Deep inside the Sun, tiny particles join together and release energy. The Sun is a huge ball of very hot material, not a burning campfire. Never look straight at the Sun.",
    "Draw a plant, an animal, and a person. How does each depend on sunlight?",
    "sun",
    [nasa("sun/facts/")],
    ["stars", "day-night", "seagrass"]
  ),
  t(
    "space",
    "moon",
    "Why does the Moon change shape?",
    "The Moon stays round. We see different amounts of its sunlit half as it travels around Earth. These changing views are called phases.",
    "The Moon does not make its own light. Moonlight is reflected sunlight. The familiar monthly phases are not caused by Earth's shadow; a shadow on the Moon is a lunar eclipse.",
    "Draw the Moon on three different evenings with a grown-up. What changes?",
    "moon",
    [nasa("moon/facts/")],
    ["sun", "tides", "gravity"]
  ),
  t(
    "space",
    "day-night",
    "What makes day and night?",
    "Earth spins. Your part of Earth has day when it faces the Sun and night when it faces away. One full turn takes about 24 hours.",
    "Earth also travels around the Sun, but that journey takes about a year. Turning and traveling are different motions. The day-and-night lab lets you turn a marked spot into and out of sunlight.",
    "Use the lab. Can the same spot be in daylight all the way around?",
    "earth",
    [nasa("earth/facts/"), place("seasons")],
    ["seasons", "sun", "maps"]
  ),
  t(
    "space",
    "planets",
    "Who is in our solar system?",
    "Eight planets travel around the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Earth is the planet we call home.",
    "The solar system also includes moons, asteroids, comets, and dwarf planets such as Pluto. The planets are very far apart. A picture that fits them all on one page usually changes their sizes or distances.",
    "Invent a memory sentence using the planets' first letters: M V E M J S U N.",
    "planets",
    [nasa("solar-system/")],
    ["mars", "saturn", "asteroids"]
  ),
  t(
    "space",
    "mars",
    "Why is Mars red?",
    "Dust and rocks on Mars contain iron minerals. Those minerals have reacted with oxygen, giving much of the surface a rusty red color.",
    "Mars has a thin atmosphere and is cold. Robot explorers study its rocks for clues about its past. Evidence shows that liquid water once flowed on parts of Mars; that does not mean people can breathe there.",
    "Design a robot explorer. What would it need to measure or photograph?",
    "mars",
    [nasa("mars/facts/")],
    ["planets", "rockets", "water-cycle"]
  ),
  t(
    "space",
    "saturn",
    "What are Saturn's rings?",
    "Saturn's rings are made of many separate pieces, mostly ice with some rock and dust. They travel around the planet. They are not one solid hoop.",
    "Saturn is a giant planet made mostly of hydrogen and helium. Its rings look bright because they reflect sunlight. Other giant planets have rings too, though Saturn's are especially easy to notice in pictures.",
    "Draw a ring close up. Show separate pieces instead of a solid bracelet.",
    "saturn",
    [nasa("saturn/facts/")],
    ["planets", "gravity", "moon"]
  ),
  t(
    "space",
    "gravity",
    "Why do things fall?",
    "Gravity is an attraction between things that have mass. Earth's gravity pulls us toward the ground. It also helps keep the Moon traveling around Earth.",
    "Gravity reaches across space. An orbiting spacecraft keeps falling toward Earth while moving forward fast enough to keep missing the ground. Astronauts floating in orbit have not escaped all gravity.",
    "Imagine tossing a ball on the Moon. How might weaker gravity change its path?",
    "gravity",
    [place("what-is-gravity")],
    ["moon", "rockets", "rivers"]
  ),
  t(
    "space",
    "stars",
    "Are all stars the same?",
    "Stars are giant glowing balls of hot material. They come in different sizes, temperatures, and colors. Our Sun is one of the many stars in the Milky Way galaxy.",
    "Blue stars are hotter at their surfaces than red stars. A star that looks faint may simply be very far away. Stars are too distant for us to visit on a quick rocket trip.",
    "Make a pretend star chart using several colors. Which color stands for the hottest stars?",
    "stars",
    [nasa("universe/stars/")],
    ["sun", "planets", "blue-sky"]
  ),
  t(
    "space",
    "rockets",
    "How does a rocket move?",
    "A rocket pushes gas out in one direction, and the rocket is pushed in the opposite direction. This push can lift a spacecraft from Earth.",
    "A rocket does not need to push against air, so it can work in space. Launching takes a lot of energy. Spacecraft can carry instruments that help us learn about planets, weather, and oceans.",
    "Draw arrows showing gas moving down and a rocket moving up.",
    "rocket",
    [place("launching-into-space")],
    ["gravity", "mars", "forecast"]
  ),
  t(
    "space",
    "asteroids",
    "What is an asteroid?",
    "An asteroid is a rocky object that travels around the Sun. Asteroids are much smaller than planets. Many orbit in the main asteroid belt between Mars and Jupiter.",
    "Asteroids are leftovers from the early solar system. They can be round or lumpy. Scientists study them to learn about the materials that helped form planets long ago.",
    "Sketch a lumpy space rock, then design a tool a robot could use to study it.",
    "asteroid",
    [nasa("solar-system/asteroids/facts/")],
    ["mars", "planets", "rockets"]
  ),
  t(
    "oceans",
    "salty",
    "Why is the ocean salty?",
    "Rain and flowing water wear away rocks on land. Rivers carry some dissolved minerals into the sea. Openings in the seafloor add minerals too.",
    "When water evaporates from the sea, most salts stay behind. Ocean water contains many dissolved salts, not just the salt we sprinkle on food. Different places can have different saltiness.",
    "Imagine a drop leaving the ocean as water vapor. What stays behind?",
    "salt",
    [noaa("whysalty")],
    ["rivers", "water-cycle", "seagrass"]
  ),
  t(
    "oceans",
    "tides",
    "Why does the shore move?",
    "The sea level rises and falls in a pattern called the tides. Gravity from the Moon and the Sun helps produce this movement.",
    "High tide and low tide change how much beach is uncovered. Tides are different from the small waves that break on the shore. Always explore a beach with a grown-up who checks local conditions.",
    "From a safe place, compare the same beach at two different times. What is covered?",
    "tides",
    [noaa("tides")],
    ["moon", "waves", "gravity"]
  ),
  t(
    "oceans",
    "waves",
    "What starts an ocean wave?",
    "Wind blowing over water makes many of the waves we see. A wave carries energy across the water. It does not carry the same bucket of water all the way across an ocean.",
    "Water near the surface moves as the wave passes. Far from shore, that motion is often roughly circular. Some waves begin with other events, such as underwater earthquakes, rather than wind.",
    "Move your hand in a circle. Imagine a wave passing while water moves around.",
    "waves",
    [noaa("wavesinocean")],
    ["wind", "tides", "islands"]
  ),
  t(
    "oceans",
    "coral",
    "Is coral a plant or an animal?",
    "Corals are animals. Many live as groups of tiny polyps. Hard corals build skeletons that can become part of a reef, where many other animals find homes.",
    "Many shallow-water corals have tiny algae living inside them. The algae use sunlight to make food and share some with the coral. Coral is living and delicate: look without touching or standing on it.",
    "Design a reef shelter with gaps for little fish. Why would the gaps matter?",
    "coral",
    [noaa("coral")],
    ["reef", "plankton", "habitats"]
  ),
  t(
    "oceans",
    "plankton",
    "What drifts in the ocean?",
    "Plankton are living things carried by currents because they cannot swim strongly enough against them. Many are tiny, but some, including certain jellyfish, are large.",
    "Phytoplankton use sunlight to make food. Zooplankton are animals, and many eat phytoplankton. These small drifters help feed much bigger ocean animals. Small does not mean unimportant.",
    "In the food-chain activity, which living thing first uses energy from sunlight?",
    "plankton",
    [noaa("plankton")],
    ["food-web", "sun", "deep-ocean"]
  ),
  t(
    "oceans",
    "seagrass",
    "Can grass grow under the sea?",
    "Seagrasses are flowering plants that grow in shallow seawater. Their leaves use sunlight, and their roots help hold them in the seabed. They are different from seaweed.",
    "Seagrass meadows provide hiding places and food for marine animals. Like plants on land, seagrasses need suitable growing conditions. Boats and trampling can damage a meadow.",
    "Draw a meadow above and below the water. What could hide between its leaves?",
    "seagrass",
    [source("NOAA Florida Keys National Marine Sanctuary", "https://floridakeys.noaa.gov/plants/seagrass.html")],
    ["turtles", "sun", "habitats"]
  ),
  t(
    "oceans",
    "deep-ocean",
    "What happens deeper in the ocean?",
    "The deeper you go underwater, the more water is above you. That increases the pressure. Deep-ocean explorers need equipment designed for this strong squeeze.",
    "Sunlight fades with depth, so the deepest water is dark. Special robots and submersibles help scientists explore places people cannot safely swim. Pressure is one reason exploring the deep sea is difficult.",
    "Design a deep-sea robot with lights and a strong outer shell. What else would help?",
    "submarine",
    [noaa("pressure"), source("NOAA Ocean Exploration", "https://oceanexplorer.noaa.gov/facts/light-distributed.html")],
    ["trench", "plankton", "rockets"]
  ),
  t(
    "oceans",
    "octopus",
    "What can eight arms do?",
    "An octopus has eight arms lined with suckers. It can use them to explore and hold food. Most of its body is soft, so it can fit into surprisingly small spaces.",
    "Octopuses can change their skin's appearance to blend with their surroundings. They are relatives of squid and cuttlefish. A squid has eight arms plus two longer feeding tentacles; an octopus has eight arms.",
    "Design an octopus disguise for a rocky seabed, then another for sand.",
    "octopus",
    [source("Smithsonian Ocean", "https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives")],
    ["camouflage", "coral", "habitats"]
  ),
  t(
    "oceans",
    "turtles",
    "How does a sea turtle breathe?",
    "Sea turtles breathe air with lungs. They must come to the surface to breathe, even though they spend much of their lives in water. Their flippers help them swim.",
    "Green turtles often eat seagrass and algae as adults. Female sea turtles come onto beaches to lay eggs. Observe turtles from a distance and give them space; never chase or feed them.",
    "Draw a turtle's trip between a seagrass meal and a breath at the surface.",
    "turtle",
    [source("NOAA Fisheries: Green Turtle", "https://www.fisheries.noaa.gov/species/green-turtle")],
    ["seagrass", "dolphins", "islands"]
  ),
  t(
    "oceans",
    "food-web",
    "Who feeds whom in the sea?",
    "A food chain follows energy from one living thing to the next. Tiny algae can feed tiny animals, which can feed fish. Bigger animals may eat those fish.",
    "Real ocean meals form a food web, with many connections. Removing one kind of living thing can affect others. The activity shows one possible chain, not every animal's entire diet.",
    "Build a chain. What might happen to the fish if their food became scarce?",
    "foodchain",
    [
      source(
        "NOAA Education: Aquatic Food Webs",
        "https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs"
      ),
    ],
    ["plankton", "dolphins", "habitats"]
  ),
  t(
    "animals",
    "bats",
    "Are bats birds?",
    "Bats are mammals, not birds. They have fur and feed their babies milk. Their wings are thin skin stretched over long fingers, rather than wings covered in feathers.",
    "Many bats use echoes to find their way and catch insects. Other bats eat fruit or nectar and help plants. Bats are wild animals: watch without touching, and tell a grown-up if one is close.",
    "Spread your fingers. Imagine a thin wing stretched between them.",
    "bat",
    [source("Smithsonian: Bat Facts", "https://www.si.edu/spotlight/bats/batfacts")],
    ["insect-flight", "bees", "habitats"]
  ),
  t(
    "animals",
    "butterflies",
    "Where does a butterfly come from?",
    "A butterfly begins as an egg, grows into a caterpillar, changes inside a pupa, and emerges as an adult butterfly. These stages look very different.",
    "Caterpillars mostly eat plants and grow before changing. Many adult butterflies drink flower nectar through a curled mouthpart. The tiny scales on their wings help create their colors.",
    "Draw four pictures that tell a butterfly's life story in order.",
    "butterfly",
    [
      source("Smithsonian: Butterflies", "https://avpreservation.si.edu/spotlight/buginfo/butterfly"),
      source("NPS: Monarch Butterfly", "https://home.nps.gov/articles/monarch-butterfly.htm"),
    ],
    ["migration", "bees", "camouflage"]
  ),
  t(
    "animals",
    "frogs",
    "Why does a tadpole change?",
    "Many frogs begin life as tadpoles in water. A tadpole grows legs and changes into a frog. Its body changes as it grows, including how it moves and breathes.",
    "Different frogs live in different ways. An African clawed frog remains very aquatic as an adult and has powerful swimming legs. A frog needs a suitable habitat, not just any puddle.",
    "Compare a tadpole's tail with a frog's legs. How do they help movement?",
    "frog",
    [source("Smithsonian National Zoo: African Clawed Frog", "https://nationalzoo.si.edu/animals/african-clawed-frog")],
    ["habitats", "rivers", "water-cycle"]
  ),
  t(
    "animals",
    "bees",
    "How can a bee help a flower?",
    "When a bee visits flowers, pollen can stick to its body and travel to another flower. This helps many flowering plants make seeds. Moving pollen this way is called pollination.",
    "Flowers may offer nectar or pollen as food. Bees are not the only pollinators: butterflies, birds, and other animals can help too. Watch visiting insects without catching or disturbing them.",
    "Draw a route between three flowers. Where might pollen travel?",
    "bee",
    [
      source(
        "Smithsonian Gardens: Pollination",
        "https://gardens.si.edu/gardens/pollinator-garden/why-what-when-where-who-how-pollination/"
      ),
    ],
    ["butterflies", "insect-flight", "habitats"]
  ),
  t(
    "animals",
    "camouflage",
    "Can you hide in plain sight?",
    "Camouflage helps an animal blend with its surroundings. Colors and patterns can make it harder for another animal to notice. A leaf-like insect or a patterned butterfly may be easy to miss.",
    "A pattern that hides well on one background may stand out on another. Some butterfly colors also warn predators instead of hiding the butterfly. Color can do more than one job.",
    "Draw a patterned butterfly on matching paper, then on a very different background.",
    "camouflage",
    [
      source(
        "Smithsonian National Museum of Natural History: Butterfly Colors",
        "https://naturalhistory.si.edu/education/teaching-resources/life-science/butterfly-colors-and-biomimicry"
      ),
    ],
    ["octopus", "butterflies", "habitats"]
  ),
  t(
    "animals",
    "dolphins",
    "Is a dolphin a fish?",
    "A dolphin is a mammal. It breathes air through a blowhole and feeds its calf milk. A fish usually gets oxygen from water through gills.",
    "Bottlenose dolphins make sounds and use echoes to help find food. They live in groups and eat animals such as fish and squid. Watch wild dolphins from a distance and never offer them food.",
    "What do dolphins and sea turtles have in common when they need a breath?",
    "dolphin",
    [
      source(
        "NOAA Fisheries: Common Bottlenose Dolphin",
        "https://www.fisheries.noaa.gov/species/common-bottlenose-dolphin"
      ),
    ],
    ["turtles", "food-web", "bats"]
  ),
  t(
    "animals",
    "habitats",
    "What makes an animal's home?",
    "A habitat is a place where a living thing can find what it needs. Animals need food, water, shelter, and enough space. Different animals need different combinations.",
    "A habitat can be a coral reef, a wetland, a forest, or many other places. A nest is only one part of a bird's habitat. The whole surrounding area must meet its needs too.",
    "Try Habitat Detective. Can you explain each match using food, water, shelter, or space?",
    "habitat",
    [
      source(
        "NPS: Food, Water, Shelter, Space",
        "https://www.nps.gov/teachers/classrooms/food-water-shelter-space.htm"
      ),
    ],
    ["coral", "seagrass", "frogs"]
  ),
  t(
    "animals",
    "migration",
    "Why do animals travel far?",
    "Some animals move between places as seasons change. This is migration. They may travel to find food, raise young, or reach a suitable climate.",
    "Many North American monarch butterflies fly toward winter resting places. Their return journey involves later generations. A migration route needs useful stopping places as well as a destination.",
    "Plan a pretend butterfly journey. Mark safe resting places and flowers along the way.",
    "migration",
    [source("NPS: Migrating Monarchs", "https://www.nps.gov/subjects/pollinators/migratingmonarchs.htm")],
    ["butterflies", "seasons", "maps"]
  ),
  t(
    "animals",
    "insect-flight",
    "How do tiny wings fly?",
    "Many insects can fly, including bees, butterflies, and dragonflies. Moving wings push on the air and help support the insect. Wings come in many shapes and beat at different speeds.",
    "Insects are the only invertebrates with true powered flight. A butterfly's broad wings and a dragonfly's narrower wings work in different ways. Flying animals are not all close relatives.",
    "Design two paper insect wings: broad and narrow. How do their shapes differ?",
    "wings",
    [source("Smithsonian: Insect Flight", "https://www.si.edu/spotlight/buginfo/insect-flight")],
    ["bats", "butterflies", "wind"]
  ),
  t(
    "animals",
    "bird-feathers",
    "What are feathers for?",
    "Feathers help birds in several ways. Flight feathers help shape wings and tails. Fluffy feathers trap air and help keep a bird warm. Not every bird can fly.",
    "Feathers have many tiny branches. Different shapes do different jobs, from insulation to steering. A penguin's wings help it move underwater. Look at wild feathers without collecting or touching them.",
    "Draw one fluffy feather for warmth and one long feather for flight. What differs?",
    "feather",
    [source("Cornell Lab: All About Feathers", "https://academy.allaboutbirds.org/feathers-article/")],
    ["insect-flight", "bats", "habitats"]
  ),
  t(
    "weather",
    "blue-sky",
    "Why is the sky blue?",
    "Sunlight contains many colors. Tiny molecules in the air scatter blue light strongly in many directions. Some of that blue light reaches your eyes from across the sky.",
    "Near sunset, sunlight travels through more air before reaching us. Much blue light has been scattered away, leaving more red and orange light. Never look straight at the Sun, even near sunset.",
    "Paint a daytime sky and a sunset sky. What colors would you choose?",
    "sky",
    [place("blue-sky")],
    ["sun", "rainbows", "clouds"]
  ),
  t(
    "weather",
    "clouds",
    "What is a cloud made of?",
    "A cloud is made of tiny water drops, ice crystals, or both. Water vapor is an invisible gas. When enough vapor changes into little drops or ice, we can see a cloud.",
    "Air that rises often cools. If it cools enough, water vapor can condense onto tiny particles. Clouds have different shapes, and one cloud shape alone does not tell the whole weather story.",
    "Use the water lab: evaporate water, cool the vapor, and watch a cloud appear.",
    "cloud",
    [source("NOAA JetStream: Clouds", "https://www.noaa.gov/jetstream/clouds")],
    ["rain", "water-cycle", "forecast"]
  ),
  t(
    "weather",
    "rain",
    "How does rain fall from a cloud?",
    "Tiny drops in a cloud can join and grow. Ice particles can grow too and melt as they fall. When drops become large enough, they fall toward the ground as rain.",
    "Some falling rain evaporates before reaching the ground. Rain that reaches land can soak into soil or flow into streams. A cloud does not need to empty all at once.",
    "Follow a drop from a cloud to a river in the water journey lab.",
    "rain",
    [
      source(
        "USGS: Precipitation and the Water Cycle",
        "https://www.usgs.gov/water-science-school/science/precipitation-and-water-cycle"
      ),
    ],
    ["clouds", "rivers", "water-cycle"]
  ),
  t(
    "weather",
    "rainbows",
    "How does a rainbow appear?",
    "Sunlight bends as it enters a water drop, reflects inside, and bends again as it leaves. Different colors bend by different amounts, spreading the sunlight into a rainbow.",
    "A rainbow depends on where you stand. Usually the Sun is behind you and rain is ahead. Another observer sees light from different drops. A rainbow is not a solid arch you can walk up to.",
    "Draw a person, Sun behind them, and rain ahead. Where might they see colors?",
    "rainbow",
    [source("National Weather Service: Rainbows", "https://www.weather.gov/fgz/Rainbow")],
    ["blue-sky", "rain", "sun"]
  ),
  t(
    "weather",
    "wind",
    "What is wind?",
    "Wind is moving air. Air moves in response to differences in air pressure. The Sun heats Earth's surface unevenly, helping create those differences.",
    "Land and water can warm at different rates. Near a coast, that can help create a sea breeze. Wind also moves clouds and transfers energy to the ocean's surface to make waves.",
    "From indoors or a safe sheltered spot, watch a tree. Which parts move first?",
    "wind",
    [source("NOAA: What Causes Wind?", "https://www.boulder.noaa.gov/video/what-causes-wind/")],
    ["waves", "clouds", "typhoons"]
  ),
  t(
    "weather",
    "lightning",
    "Why does thunder rumble?",
    "Lightning is a powerful electrical discharge. It heats the air very quickly, and the expanding air makes a sound wave called thunder. We see the flash before we hear the sound because light travels faster.",
    "Lightning can happen inside a cloud, between clouds, or between a cloud and the ground. If you hear thunder, tell a grown-up and go inside a substantial building. Watching from shelter is safer.",
    "From memory or a picture, draw a storm. Show the family safely indoors, away from windows.",
    "lightning",
    [
      source(
        "NOAA NESDIS: Lightning and Thunder",
        "https://www.nesdis.noaa.gov/about/k-12-education/severe-weather/what-causes-lightning-and-thunder"
      ),
    ],
    ["clouds", "typhoons", "forecast"]
  ),
  t(
    "weather",
    "typhoons",
    "Is a typhoon a hurricane?",
    "Both are names for the same kind of large spinning tropical storm. In the western North Pacific, including near Guam, this kind of storm is called a typhoon.",
    "Tropical cyclones draw energy from warm ocean water. Their winds and rain can be dangerous. This app is for learning, not live warnings: a grown-up should follow local officials and prepare early.",
    "With a grown-up, name three things your family keeps ready for a storm.",
    "storm",
    [source("NOAA: Hurricane or Typhoon?", "https://oceanservice.noaa.gov/facts/cyclone.html"), place("hurricanes")],
    ["wind", "guam", "forecast"]
  ),
  t(
    "weather",
    "water-cycle",
    "Where does water go?",
    "Water moves between the ocean, air, land, and living things. Liquid water can evaporate into vapor, condense into drops, and fall as rain. It can also freeze or melt.",
    "The water cycle has many paths, not just one circle. Some water soaks into the ground. Some flows down rivers. Water may stay in ice, soil, lakes, or oceans for very different lengths of time.",
    "In the lab, change liquid water to vapor, then bring it back to the ground.",
    "cycle",
    [
      source(
        "NOAA Education: The Water Cycle",
        "https://www.noaa.gov/education/resource-collections/freshwater/water-cycle"
      ),
    ],
    ["rain", "salty", "rivers"]
  ),
  t(
    "weather",
    "seasons",
    "Why do seasons change?",
    "Earth's axis is tilted. As Earth travels around the Sun, different parts receive more direct sunlight and longer days. This helps cause the seasons.",
    "The northern and southern halves of Earth have opposite seasons. Seasons are not mainly caused by Earth moving closer to the Sun. Near the tropics, wet and dry patterns may be more noticeable than snowy winters.",
    "Draw a tilted Earth beside the Sun. Which half receives more direct light?",
    "seasons",
    [place("seasons")],
    ["day-night", "migration", "guam"]
  ),
  t(
    "weather",
    "forecast",
    "How do people predict weather?",
    "Weather scientists collect observations from the ground, balloons, satellites, and other tools. Computers help them use these observations to make a forecast: a prediction of what may happen next.",
    "A forecast is not a promise. Air and water are always changing, and predictions can change as new observations arrive. This offline app has no current forecast. Ask a grown-up for today's local weather information.",
    "Invent a weather station. Which tools would you use for temperature, wind, and rain?",
    "forecast",
    [
      source(
        "NOAA Education: Weather Observations",
        "https://www.noaa.gov/education/resource-collections/weather-atmosphere/weather-observations"
      ),
    ],
    ["clouds", "wind", "rockets"]
  ),
  t(
    "world",
    "guam",
    "Where is Guam?",
    "Guam is an island in the western Pacific Ocean. It is the southernmost island of the Mariana Islands. An island is land with water all around it.",
    "Guam has beaches, reefs, hills, and forests. Its northern limestone landscape and southern volcanic hills tell parts of its long geological story. People live, work, and care for these connected places.",
    "Find Guam on the map. Which ocean surrounds it?",
    "guam",
    [
      source("NPS: War in the Pacific Nature", "https://www.nps.gov/wapa/learn/nature/index.htm"),
      source("USGS: Geology of Guam", "https://pubs.usgs.gov/pp/0403a/report.pdf"),
    ],
    ["islands", "reef", "trench"]
  ),
  t(
    "world",
    "islands",
    "How can land be an island?",
    "An island is a piece of land surrounded by water. Some islands form through volcanic activity. Others grow or change through coral building, moving sediments, or changes in sea level.",
    "Many ocean islands are the tops of much larger landforms rising from the seafloor. An island's shore can change as waves, currents, and storms move sand and other material.",
    "Draw the part of a pretend island above water and its hidden base below.",
    "island",
    [
      source(
        "NPS: Pacific Islands Geology",
        "https://home.nps.gov/subjects/geology/geodiversity-atlas-pacific-islands-network-index.htm"
      ),
    ],
    ["guam", "volcanoes", "waves"]
  ),
  t(
    "world",
    "reef",
    "Why care for Guam's reefs?",
    "A coral reef is a living neighborhood. Fish and many other animals find food and shelter there. Reefs can also reduce some wave energy before it reaches shore.",
    "Reefs need suitable water conditions to thrive. Touching coral, leaving litter, and damaging habitats can harm living things. On a family visit, leave animals and coral where they are and follow local guidance.",
    "Draw a reef neighborhood. Show three different places an animal could shelter.",
    "reef",
    [source("NOAA: Coral Animals", "https://oceanservice.noaa.gov/facts/coral.html"), noaa("coral_protect")],
    ["coral", "habitats", "guam"]
  ),
  t(
    "world",
    "trench",
    "What is the Mariana Trench?",
    "The Mariana Trench is a very deep part of the Pacific Ocean near the Mariana Islands. It forms where one of Earth's moving plates bends down beneath another.",
    "Its deepest known area is called Challenger Deep. The water there is dark and under enormous pressure. Deep does not mean lifeless: scientists use special equipment to investigate this ocean environment.",
    "Draw a cross-section of a trench. Add a tiny research vehicle for scale.",
    "trench",
    [source("NOAA: Deepest Ocean", "https://oceanservice.noaa.gov/facts/oceandepth.html")],
    ["deep-ocean", "volcanoes", "guam"]
  ),
  t(
    "world",
    "mountains",
    "How can mountains grow?",
    "Earth's outer shell is divided into slowly moving plates. Where plates push together, rock can fold, break, and rise into mountains. Volcanoes can build mountains too.",
    "Mountains keep changing after they form. Rain, rivers, ice, and wind can wear rock away. Building and wearing down happen over long periods. A mountain is not always a volcano.",
    "Fold a sheet of scrap paper gently. How do the raised folds resemble hills?",
    "mountain",
    [
      source(
        "USGS: Geology of Denali",
        "https://www.usgs.gov/geology-and-ecology-of-national-parks/geology-denali-national-park-and-preserve"
      ),
    ],
    ["volcanoes", "rivers", "trench"]
  ),
  t(
    "world",
    "rivers",
    "Why do rivers wind toward the sea?",
    "Rivers carry flowing water downhill under gravity. They collect water from rain, melting snow, springs, and smaller streams. Many eventually reach a lake or the ocean.",
    "Flowing water can wear away rock and move sediment. A river can curve because of the land and the way water erodes and deposits material. Not every river reaches the sea.",
    "Draw a mountain, a river, and the ocean. Add arrows showing the downhill path.",
    "river",
    [
      source(
        "USGS: Rivers, Streams, and Creeks",
        "https://www.usgs.gov/water-science-school/science/rivers-streams-and-creeks"
      ),
    ],
    ["gravity", "salty", "rain"]
  ),
  t(
    "world",
    "continents",
    "What are continents?",
    "Continents are Earth's large land regions. A common seven-continent model names Africa, Antarctica, Asia, Europe, North America, South America, and Australia. People sometimes group the land differently.",
    "A map flattens Earth's curved surface, so it changes some shapes, sizes, or distances. A globe is a round model. Neither a map nor a globe can show every detail at once.",
    "Find Australia and Antarctica on the expedition map. What is different about their surroundings?",
    "globe",
    [source("USGS: This Dynamic Planet", "https://pubs.usgs.gov/imap/2800/")],
    ["maps", "guam", "directions"]
  ),
  t(
    "world",
    "maps",
    "How do you read a map?",
    "A map uses shapes, colors, and symbols to show places. A key explains what the symbols mean. A scale helps connect a distance on the map to a distance in the real world.",
    "Maps are made for different jobs. A walking map may show paths, while a weather map shows air conditions. Our illustrated expedition map is a simplified learning map, not a navigation chart.",
    "Make a map of an imaginary island. Add a key for a river, a mountain, and a home.",
    "map",
    [source("USGS: Topographic Map Symbols", "https://www.usgs.gov/publications/topographic-map-symbols")],
    ["directions", "continents", "forecast"]
  ),
  t(
    "world",
    "directions",
    "Which way is north?",
    "North, east, south, and west are directions. A compass rose on a map shows how the map is oriented. Many maps put north at the top, but not all do.",
    "A magnetic compass points toward magnetic north, which is not exactly the same as the geographic North Pole. A map may show different north arrows. Use real navigation tools with a knowledgeable grown-up.",
    "On a pretend north-up map, put a mountain north of a river and a beach east of it.",
    "compass",
    [
      source(
        "USGS: North Arrows",
        "https://www.usgs.gov/faqs/what-do-different-north-arrows-a-usgs-topographic-map-mean?items_per_page=6&page=1"
      ),
    ],
    ["maps", "continents", "migration"]
  ),
  t(
    "world",
    "volcanoes",
    "What is inside a volcano?",
    "Melted rock below the ground is called magma. When it reaches the surface, it is called lava. A volcano is an opening where material from inside Earth can reach the surface.",
    "Volcanoes do not all erupt in the same way. Some build islands and mountains over many eruptions. Many occur near plate boundaries, but some form over hot spots within a plate.",
    "Draw a volcano cross-section. Label magma below the ground and lava at the surface.",
    "volcano",
    [
      source("USGS: About Volcanoes", "https://www.usgs.gov/programs/VHP/about-volcanoes"),
      source("USGS: Volcanoes", "https://pubs.usgs.gov/gip/volc/nature.html"),
    ],
    ["mountains", "islands", "trench"]
  ),
];
export const topicById = (id: string) => TOPICS.find((topic) => topic.id === id);
export const topicNarration = (topic: ExploreTopic) =>
  `${topic.title} ${topic.short} A little deeper. ${topic.deeper} Something to try. ${topic.question}`;
export function normalizeExploreFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && !!topicById(id)))].sort();
}
export function searchTopics(query: string, world?: WorldId, favorites?: readonly string[]): ExploreTopic[] {
  const words = query.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean).slice(0, 12);
  return TOPICS.filter(
    (topic) =>
      (!world || topic.world === world) &&
      (!favorites || favorites.includes(topic.id)) &&
      words.every((word) =>
        `${topic.title} ${topic.short} ${topic.deeper} ${WORLDS.find((w) => w.id === topic.world)?.title}`
          .toLocaleLowerCase("en")
          .includes(word)
      )
  );
}

/** Keep the corrected lightning transcript from playing an older unsafe activity clip. */
export const topicSpeechKey = (id: string) => id === "lightning" ? "science-v25-explore-lightning" : `explore-${id}`;

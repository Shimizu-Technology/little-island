import type { ReadingScene } from "../../kit/reading";
/**
 * One story page: the sentence, its picture, a near-miss picture that changes exactly one thing, and the word
 * in the sentence that tells them apart (the "cue"). She reads the page, then picks the picture that matches.
 */
export type TalePage = { text: string; scene: ReadingScene; miss: ReadingScene; cue: string };
export type Tale = {
  id: string;
  pace: "easy" | "medium" | "hard";
  title: string;
  skill: string;
  pages: TalePage[];
  /** Each page's picture check, right picture first (kept beside the pages for content checks). */
  questions: { scenes: [ReadingScene, ReadingScene] }[];
};
const TALES: Omit<Tale, "questions">[] = [
  {
    "id": "tale-0",
    "pace": "easy",
    "title": "The hat hop",
    "skill": "read.short-a",
    "pages": [
      {
        "text": "Cat has a big red hat.",
        "scene": {
          "subject": "hat",
          "object": "cat",
          "relation": "beside",
          "color": "red",
          "size": "big"
        },
        "miss": {
          "subject": "hat",
          "object": "cat",
          "relation": "beside",
          "color": "blue",
          "size": "big"
        },
        "cue": "red"
      },
      {
        "text": "Pup sat on the mat.",
        "scene": {
          "subject": "dog",
          "object": "mat",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "cat",
          "object": "mat",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "pup"
      },
      {
        "text": "Pup can hop and hop.",
        "scene": {
          "subject": "dog",
          "object": "mat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "pig",
          "object": "mat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "pup"
      },
      {
        "text": "Hop, hop, hop! Pup hit the hat.",
        "scene": {
          "subject": "hat",
          "object": "dog",
          "relation": "beside",
          "color": "red",
          "size": "big"
        },
        "miss": {
          "subject": "hat",
          "object": "cat",
          "relation": "beside",
          "color": "red",
          "size": "big"
        },
        "cue": "pup"
      },
      {
        "text": "The red hat is on Pup!",
        "scene": {
          "subject": "hat",
          "object": "dog",
          "relation": "on",
          "color": "red",
          "size": "big"
        },
        "miss": {
          "subject": "hat",
          "object": "dog",
          "relation": "beside",
          "color": "red",
          "size": "big"
        },
        "cue": "on"
      },
      {
        "text": "Cat and Pup nap in the sun.",
        "scene": {
          "subject": "cat",
          "object": "sun",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "cat",
          "object": "moon",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "sun"
      }
    ]
  },
  {
    "id": "tale-1",
    "pace": "easy",
    "title": "Pig is hot",
    "skill": "read.short-u",
    "pages": [
      {
        "text": "The sun is hot. Pig is hot.",
        "scene": {
          "subject": "pig",
          "object": "sun",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "hen",
          "object": "sun",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "pig"
      },
      {
        "text": "Pig can get in the tub.",
        "scene": {
          "subject": "pig",
          "object": "tub",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "pig",
          "object": "tub",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Hen has a cup.",
        "scene": {
          "subject": "hen",
          "object": "cup",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "hen",
          "object": "hat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "cup"
      },
      {
        "text": "Hen can dip the cup in the tub.",
        "scene": {
          "subject": "hen",
          "object": "tub",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "pig",
          "object": "tub",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "hen"
      },
      {
        "text": "Pig is wet. Hen is wet. Yes!",
        "scene": {
          "subject": "pig",
          "object": "tub",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "cat",
          "object": "tub",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "cue": "pig"
      },
      {
        "text": "Pig and Hen hug in the sun.",
        "scene": {
          "subject": "pig",
          "object": "hen",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "pig",
          "object": "dog",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "hen"
      }
    ]
  },
  {
    "id": "tale-2",
    "pace": "easy",
    "title": "Bug in a cup",
    "skill": "read.short-u",
    "pages": [
      {
        "text": "A bug sat on a rug.",
        "scene": {
          "subject": "bug",
          "object": "rug",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "bug",
          "object": "rug",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "on"
      },
      {
        "text": "Cat ran to the rug.",
        "scene": {
          "subject": "cat",
          "object": "rug",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "dog",
          "object": "rug",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "cat"
      },
      {
        "text": "The bug hid in a cup.",
        "scene": {
          "subject": "bug",
          "object": "cup",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "bug",
          "object": "cup",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Cat can tip the cup.",
        "scene": {
          "subject": "cat",
          "object": "cup",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "cat",
          "object": "box",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "cup"
      },
      {
        "text": "Is the bug in the cup? Up, up, up!",
        "scene": {
          "subject": "bug",
          "object": "cat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "bee",
          "object": "cat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "bug"
      },
      {
        "text": "The bug is on top of Cat. Hum, hum!",
        "scene": {
          "subject": "bug",
          "object": "cat",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "bug",
          "object": "dog",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "cat"
      }
    ]
  },
  {
    "id": "tale-3",
    "pace": "easy",
    "title": "Fox in a box",
    "skill": "read.short-o",
    "pages": [
      {
        "text": "Fox has a big box.",
        "scene": {
          "subject": "fox",
          "object": "box",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "fox",
          "object": "bed",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "box"
      },
      {
        "text": "Fox can hop in the box.",
        "scene": {
          "subject": "fox",
          "object": "box",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "fox",
          "object": "box",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Dog ran up to the box.",
        "scene": {
          "subject": "dog",
          "object": "box",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "cat",
          "object": "box",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "dog"
      },
      {
        "text": "Is Fox in the box? Dog can not get Fox.",
        "scene": {
          "subject": "dog",
          "object": "box",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "pig",
          "object": "box",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "dog"
      },
      {
        "text": "Pop! Fox is up on top of Dog!",
        "scene": {
          "subject": "fox",
          "object": "dog",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "fox",
          "object": "cat",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "dog"
      },
      {
        "text": "Dog and Fox run to the log.",
        "scene": {
          "subject": "dog",
          "object": "log",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "dog",
          "object": "rock",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "log"
      }
    ]
  },
  {
    "id": "tale-4",
    "pace": "medium",
    "title": "Crab and the snug shell",
    "skill": "read.digraph-sh",
    "pages": [
      {
        "text": "Crab is on a rock in the sand.",
        "scene": {
          "subject": "crab",
          "object": "rock",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "crab",
          "object": "rock",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "on"
      },
      {
        "text": "Crab has to get a shell.",
        "scene": {
          "subject": "crab",
          "object": "rock",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "fish",
          "object": "rock",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "crab"
      },
      {
        "text": "This shell is big. It is not snug.",
        "scene": {
          "subject": "crab",
          "object": "shell",
          "relation": "beside",
          "color": "coral",
          "size": "big",
          "subjectSize": 61,
          "objectSize": 82
        },
        "miss": {
          "subject": "crab",
          "object": "rock",
          "relation": "beside",
          "color": "coral",
          "size": "big",
          "subjectSize": 61,
          "objectSize": 82
        },
        "cue": "shell"
      },
      {
        "text": "This shell is little. It is not snug.",
        "scene": {
          "subject": "crab",
          "object": "shell",
          "relation": "beside",
          "color": "coral",
          "size": "little",
          "subjectSize": 61,
          "objectSize": 38
        },
        "miss": {
          "subject": "crab",
          "object": "rock",
          "relation": "beside",
          "color": "coral",
          "size": "little",
          "subjectSize": 61,
          "objectSize": 38
        },
        "cue": "shell"
      },
      {
        "text": "This shell is just the best! Crab can hide in the shell.",
        "scene": {
          "subject": "crab",
          "object": "shell",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "crab",
          "object": "shell",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Fish can swim up. Crab and Fish clap and grin.",
        "scene": {
          "subject": "crab",
          "object": "fish",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "crab",
          "object": "duck",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "fish"
      }
    ]
  },
  {
    "id": "tale-5",
    "pace": "medium",
    "title": "The splash ship",
    "skill": "read.blend-start",
    "pages": [
      {
        "text": "Duck has a red ship.",
        "scene": {
          "subject": "ship",
          "object": "duck",
          "relation": "beside",
          "color": "red",
          "size": "big"
        },
        "miss": {
          "subject": "ship",
          "object": "duck",
          "relation": "beside",
          "color": "blue",
          "size": "big"
        },
        "cue": "red"
      },
      {
        "text": "Frog can jump in the ship.",
        "scene": {
          "subject": "frog",
          "object": "ship",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "frog",
          "object": "ship",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Duck and Frog sing a long song.",
        "scene": {
          "subject": "duck",
          "object": "frog",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "duck",
          "object": "fish",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "frog"
      },
      {
        "text": "A big wave! Splash! Duck is in the ship.",
        "scene": {
          "subject": "duck",
          "object": "ship",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "frog",
          "object": "ship",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "cue": "duck"
      },
      {
        "text": "Frog is wet. Duck is wet. The ship is fine.",
        "scene": {
          "subject": "frog",
          "object": "ship",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "frog",
          "object": "rock",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "ship"
      },
      {
        "text": "Duck and Frog sing the song. Splash, splash, splash!",
        "scene": {
          "subject": "duck",
          "object": "frog",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "hen",
          "object": "frog",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "duck"
      }
    ]
  },
  {
    "id": "tale-6",
    "pace": "medium",
    "title": "The lost ring",
    "skill": "read.ng",
    "pages": [
      {
        "text": "Hen has a ring.",
        "scene": {
          "subject": "hen",
          "object": "ring",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "hen",
          "object": "shell",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "ring"
      },
      {
        "text": "Then the ring is lost in the sand.",
        "scene": {
          "subject": "ring",
          "object": "sand",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "ring",
          "object": "sand",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Hen is sad. Hen can not sing.",
        "scene": {
          "subject": "hen",
          "object": "sand",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "duck",
          "object": "sand",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "hen"
      },
      {
        "text": "Crab can dig and dig and dig.",
        "scene": {
          "subject": "crab",
          "object": "sand",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "frog",
          "object": "sand",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "crab"
      },
      {
        "text": "Crab has the ring!",
        "scene": {
          "subject": "crab",
          "object": "ring",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "crab",
          "object": "shell",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "ring"
      },
      {
        "text": "Hen can grin. Hen and Crab sing a long song.",
        "scene": {
          "subject": "hen",
          "object": "crab",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "hen",
          "object": "fish",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "crab"
      }
    ]
  },
  {
    "id": "tale-7",
    "pace": "medium",
    "title": "The best nest",
    "skill": "read.blend-end",
    "pages": [
      {
        "text": "Duck has a nest on a rock.",
        "scene": {
          "subject": "nest",
          "object": "rock",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "nest",
          "object": "log",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "rock"
      },
      {
        "text": "Duck can swim in the pond.",
        "scene": {
          "subject": "duck",
          "object": "pond",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "duck",
          "object": "pond",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Frog can hop in the nest to rest.",
        "scene": {
          "subject": "frog",
          "object": "nest",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "duck",
          "object": "nest",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "cue": "frog"
      },
      {
        "text": "Duck is back. Frog in the nest?",
        "scene": {
          "subject": "duck",
          "object": "nest",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "hen",
          "object": "nest",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "duck"
      },
      {
        "text": "Frog can jump in the pond. Plop!",
        "scene": {
          "subject": "frog",
          "object": "pond",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "frog",
          "object": "pond",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Duck can rest in the nest. That is best.",
        "scene": {
          "subject": "duck",
          "object": "nest",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "frog",
          "object": "nest",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "cue": "duck"
      }
    ]
  },
  {
    "id": "tale-8",
    "pace": "hard",
    "title": "Goat and the cake boat",
    "skill": "read.vowel-team-oa",
    "pages": [
      {
        "text": "Goat can bake a cake.",
        "scene": {
          "subject": "goat",
          "object": "cake",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "sheep",
          "object": "cake",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "goat"
      },
      {
        "text": "Goat and the cake sail in a boat.",
        "scene": {
          "subject": "goat",
          "object": "boat",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "goat",
          "object": "boat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Rain! The rain is on the sail.",
        "scene": {
          "subject": "rain",
          "object": "boat",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "sun",
          "object": "boat",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "rain"
      },
      {
        "text": "Goat has a coat for the cake.",
        "scene": {
          "subject": "goat",
          "object": "coat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "goat",
          "object": "hat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "coat"
      },
      {
        "text": "Sheep is on the beach. The cake is not wet!",
        "scene": {
          "subject": "sheep",
          "object": "sand",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "goat",
          "object": "sand",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "sheep"
      },
      {
        "text": "Goat and Sheep eat the cake in the boat.",
        "scene": {
          "subject": "goat",
          "object": "sheep",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "goat",
          "object": "seal",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "sheep"
      }
    ]
  },
  {
    "id": "tale-9",
    "pace": "hard",
    "title": "A leaf for Toad",
    "skill": "read.vowel-team-ea",
    "pages": [
      {
        "text": "Toad is on the road.",
        "scene": {
          "subject": "toad",
          "object": "road",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "toad",
          "object": "road",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "on"
      },
      {
        "text": "Rain! Toad has to get a coat.",
        "scene": {
          "subject": "toad",
          "object": "coat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "seal",
          "object": "coat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "toad"
      },
      {
        "text": "Toad can see a big leaf.",
        "scene": {
          "subject": "toad",
          "object": "leaf",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "toad",
          "object": "rock",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "leaf"
      },
      {
        "text": "The leaf is a coat for Toad!",
        "scene": {
          "subject": "leaf",
          "object": "toad",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "leaf",
          "object": "seal",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "cue": "toad"
      },
      {
        "text": "Bee is wet. Bee can sit on the leaf.",
        "scene": {
          "subject": "bee",
          "object": "leaf",
          "relation": "on",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "bee",
          "object": "leaf",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "on"
      },
      {
        "text": "Toad and Bee see the rain stop.",
        "scene": {
          "subject": "toad",
          "object": "bee",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "toad",
          "object": "seal",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "bee"
      }
    ]
  },
  {
    "id": "tale-10",
    "pace": "hard",
    "title": "The kite in the tree",
    "skill": "read.r-controlled-or",
    "pages": [
      {
        "text": "Crab has a red kite.",
        "scene": {
          "subject": "kite",
          "object": "crab",
          "relation": "beside",
          "color": "red",
          "size": "big"
        },
        "miss": {
          "subject": "kite",
          "object": "crab",
          "relation": "beside",
          "color": "blue",
          "size": "big"
        },
        "cue": "red"
      },
      {
        "text": "A storm! The kite can rise up, up, up.",
        "scene": {
          "subject": "kite",
          "object": "crab",
          "relation": "beside",
          "color": "red",
          "size": "big"
        },
        "miss": {
          "subject": "leaf",
          "object": "crab",
          "relation": "beside",
          "color": "red",
          "size": "big"
        },
        "cue": "kite"
      },
      {
        "text": "Zoom! The kite is in the tree.",
        "scene": {
          "subject": "kite",
          "object": "tree",
          "relation": "in",
          "color": "red",
          "size": "big"
        },
        "miss": {
          "subject": "kite",
          "object": "tree",
          "relation": "under",
          "color": "red",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Goat has a long rope.",
        "scene": {
          "subject": "goat",
          "object": "rope",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "sheep",
          "object": "rope",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "goat"
      },
      {
        "text": "Goat can reach the kite with the rope.",
        "scene": {
          "subject": "goat",
          "object": "tree",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "seal",
          "object": "tree",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "goat"
      },
      {
        "text": "Crab and Goat take the kite to the beach.",
        "scene": {
          "subject": "crab",
          "object": "goat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "crab",
          "object": "sheep",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "goat"
      }
    ]
  },
  {
    "id": "tale-11",
    "pace": "hard",
    "title": "The moon pool",
    "skill": "read.vowel-team-oo",
    "pages": [
      {
        "text": "Seal can swim in a cool pool.",
        "scene": {
          "subject": "seal",
          "object": "pond",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "seal",
          "object": "pond",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "in"
      },
      {
        "text": "Soon the moon is up.",
        "scene": {
          "subject": "moon",
          "object": "pond",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "sun",
          "object": "pond",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "moon"
      },
      {
        "text": "Sheep is in a boat on the sea.",
        "scene": {
          "subject": "sheep",
          "object": "boat",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "goat",
          "object": "boat",
          "relation": "in",
          "color": "coral",
          "size": "big"
        },
        "cue": "sheep"
      },
      {
        "text": "Sheep can see Seal in the pool.",
        "scene": {
          "subject": "sheep",
          "object": "seal",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "sheep",
          "object": "goat",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "seal"
      },
      {
        "text": "Seal can see a star.",
        "scene": {
          "subject": "seal",
          "object": "star",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "seal",
          "object": "moon",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "star"
      },
      {
        "text": "Seal and Sheep see the moon and the star.",
        "scene": {
          "subject": "seal",
          "object": "moon",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "miss": {
          "subject": "seal",
          "object": "sun",
          "relation": "beside",
          "color": "coral",
          "size": "big"
        },
        "cue": "moon"
      }
    ]
  }
];
export const STORIES: Tale[] = TALES.map((t) => ({ ...t, questions: t.pages.map((p) => ({ scenes: [p.scene, p.miss] })) }));

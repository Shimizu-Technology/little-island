import type { ReadingScene } from "../../kit/reading";
export type PictureSentence = { id: string; pace: "easy" | "medium" | "hard"; skill: string; text: string; scenes: ReadingScene[]; difference: string[] };
export const SENTENCES: PictureSentence[] = [
  {
    "id": "easy-0",
    "pace": "easy",
    "skill": "read.short-a",
    "text": "The cat is on the box.",
    "scenes": [
      {
        "subject": "cat",
        "object": "box",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "cat",
        "object": "box",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "dog",
        "object": "box",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "in",
      "dog"
    ]
  },
  {
    "id": "easy-1",
    "pace": "easy",
    "skill": "read.short-o",
    "text": "The dog is in the box.",
    "scenes": [
      {
        "subject": "dog",
        "object": "box",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "dog",
        "object": "box",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "pig",
        "object": "box",
        "relation": "in",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "pig"
    ]
  },
  {
    "id": "easy-2",
    "pace": "easy",
    "skill": "read.short-i",
    "text": "The pig is under the box.",
    "scenes": [
      {
        "subject": "pig",
        "object": "box",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "pig",
        "object": "box",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "hen",
        "object": "box",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "hen"
    ]
  },
  {
    "id": "easy-3",
    "pace": "easy",
    "skill": "read.short-e",
    "text": "The hen is on the box.",
    "scenes": [
      {
        "subject": "hen",
        "object": "box",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "hen",
        "object": "box",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fox",
        "object": "box",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "in",
      "fox"
    ]
  },
  {
    "id": "easy-4",
    "pace": "easy",
    "skill": "read.short-o",
    "text": "The fox is in the box.",
    "scenes": [
      {
        "subject": "fox",
        "object": "box",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fox",
        "object": "box",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "cat",
        "object": "box",
        "relation": "in",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "cat"
    ]
  },
  {
    "id": "easy-5",
    "pace": "easy",
    "skill": "read.short-a",
    "text": "The cat is under the bed.",
    "scenes": [
      {
        "subject": "cat",
        "object": "bed",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "cat",
        "object": "bed",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "dog",
        "object": "bed",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "dog"
    ]
  },
  {
    "id": "easy-6",
    "pace": "easy",
    "skill": "read.short-o",
    "text": "The dog is on the bed.",
    "scenes": [
      {
        "subject": "dog",
        "object": "bed",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "dog",
        "object": "bed",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "pig",
        "object": "bed",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "in",
      "pig"
    ]
  },
  {
    "id": "easy-7",
    "pace": "easy",
    "skill": "read.short-i",
    "text": "The pig is in the bed.",
    "scenes": [
      {
        "subject": "pig",
        "object": "bed",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "pig",
        "object": "bed",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "hen",
        "object": "bed",
        "relation": "in",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "hen"
    ]
  },
  {
    "id": "easy-8",
    "pace": "easy",
    "skill": "read.short-e",
    "text": "The hen is under the bed.",
    "scenes": [
      {
        "subject": "hen",
        "object": "bed",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "hen",
        "object": "bed",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fox",
        "object": "bed",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "fox"
    ]
  },
  {
    "id": "easy-9",
    "pace": "easy",
    "skill": "read.short-o",
    "text": "The fox is on the bed.",
    "scenes": [
      {
        "subject": "fox",
        "object": "bed",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fox",
        "object": "bed",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "cat",
        "object": "bed",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "in",
      "cat"
    ]
  },
  {
    "id": "easy-10",
    "pace": "easy",
    "skill": "read.short-a",
    "text": "The cat is on the rug.",
    "scenes": [
      {
        "subject": "cat",
        "object": "rug",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "cat",
        "object": "rug",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "dog",
        "object": "rug",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "dog"
    ]
  },
  {
    "id": "easy-11",
    "pace": "easy",
    "skill": "read.short-o",
    "text": "The dog is under the rug.",
    "scenes": [
      {
        "subject": "dog",
        "object": "rug",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "dog",
        "object": "rug",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "pig",
        "object": "rug",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "pig"
    ]
  },
  {
    "id": "easy-12",
    "pace": "easy",
    "skill": "read.short-i",
    "text": "The little blue pig.",
    "scenes": [
      {
        "subject": "pig",
        "object": "rug",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "pig",
        "object": "rug",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "pig",
        "object": "rug",
        "relation": "beside",
        "color": "red",
        "size": "little"
      }
    ],
    "difference": [
      "",
      "big",
      "red"
    ]
  },
  {
    "id": "easy-13",
    "pace": "easy",
    "skill": "read.short-e",
    "text": "The big red hen.",
    "scenes": [
      {
        "subject": "hen",
        "object": "rug",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "hen",
        "object": "rug",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "hen",
        "object": "rug",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "blue"
    ]
  },
  {
    "id": "easy-14",
    "pace": "easy",
    "skill": "read.short-o",
    "text": "The big blue fox.",
    "scenes": [
      {
        "subject": "fox",
        "object": "rug",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "fox",
        "object": "rug",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "fox",
        "object": "rug",
        "relation": "beside",
        "color": "red",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "red"
    ]
  },
  {
    "id": "easy-15",
    "pace": "easy",
    "skill": "read.short-a",
    "text": "The little red cat.",
    "scenes": [
      {
        "subject": "cat",
        "object": "mat",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "cat",
        "object": "mat",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "cat",
        "object": "mat",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      }
    ],
    "difference": [
      "",
      "big",
      "blue"
    ]
  },
  {
    "id": "easy-16",
    "pace": "easy",
    "skill": "read.short-o",
    "text": "The big blue dog.",
    "scenes": [
      {
        "subject": "dog",
        "object": "mat",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "dog",
        "object": "mat",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "dog",
        "object": "mat",
        "relation": "beside",
        "color": "red",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "red"
    ]
  },
  {
    "id": "easy-17",
    "pace": "easy",
    "skill": "read.short-i",
    "text": "The big red pig.",
    "scenes": [
      {
        "subject": "pig",
        "object": "mat",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "pig",
        "object": "mat",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "pig",
        "object": "mat",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "blue"
    ]
  },
  {
    "id": "easy-18",
    "pace": "easy",
    "skill": "read.short-e",
    "text": "The little blue hen.",
    "scenes": [
      {
        "subject": "hen",
        "object": "mat",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "hen",
        "object": "mat",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "hen",
        "object": "mat",
        "relation": "beside",
        "color": "red",
        "size": "little"
      }
    ],
    "difference": [
      "",
      "big",
      "red"
    ]
  },
  {
    "id": "easy-19",
    "pace": "easy",
    "skill": "read.short-o",
    "text": "The big red fox.",
    "scenes": [
      {
        "subject": "fox",
        "object": "mat",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "fox",
        "object": "mat",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "fox",
        "object": "mat",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "blue"
    ]
  },
  {
    "id": "medium-0",
    "pace": "medium",
    "skill": "read.blend-start",
    "text": "The crab is on the rock.",
    "scenes": [
      {
        "subject": "crab",
        "object": "rock",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "crab",
        "object": "rock",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fish",
        "object": "rock",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "fish"
    ]
  },
  {
    "id": "medium-1",
    "pace": "medium",
    "skill": "read.digraph-sh",
    "text": "The fish is on the rock.",
    "scenes": [
      {
        "subject": "fish",
        "object": "rock",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fish",
        "object": "rock",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "duck",
        "object": "rock",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "duck"
    ]
  },
  {
    "id": "medium-2",
    "pace": "medium",
    "skill": "read.digraph-ck",
    "text": "The duck is under the rock.",
    "scenes": [
      {
        "subject": "duck",
        "object": "rock",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "duck",
        "object": "rock",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "frog",
        "object": "rock",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "frog"
    ]
  },
  {
    "id": "medium-3",
    "pace": "medium",
    "skill": "read.blend-start",
    "text": "The frog is on the rock.",
    "scenes": [
      {
        "subject": "frog",
        "object": "rock",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "frog",
        "object": "rock",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "moth",
        "object": "rock",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "moth"
    ]
  },
  {
    "id": "medium-4",
    "pace": "medium",
    "skill": "read.digraph-th",
    "text": "The moth is on the rock.",
    "scenes": [
      {
        "subject": "moth",
        "object": "rock",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "moth",
        "object": "rock",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "crab",
        "object": "rock",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "crab"
    ]
  },
  {
    "id": "medium-5",
    "pace": "medium",
    "skill": "read.blend-start",
    "text": "The crab is under the ship.",
    "scenes": [
      {
        "subject": "crab",
        "object": "ship",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "crab",
        "object": "ship",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fish",
        "object": "ship",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "fish"
    ]
  },
  {
    "id": "medium-6",
    "pace": "medium",
    "skill": "read.digraph-sh",
    "text": "The fish is on the ship.",
    "scenes": [
      {
        "subject": "fish",
        "object": "ship",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fish",
        "object": "ship",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "duck",
        "object": "ship",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "in",
      "duck"
    ]
  },
  {
    "id": "medium-7",
    "pace": "medium",
    "skill": "read.digraph-ck",
    "text": "The duck is in the ship.",
    "scenes": [
      {
        "subject": "duck",
        "object": "ship",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "duck",
        "object": "ship",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "frog",
        "object": "ship",
        "relation": "in",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "frog"
    ]
  },
  {
    "id": "medium-8",
    "pace": "medium",
    "skill": "read.blend-start",
    "text": "The frog is under the ship.",
    "scenes": [
      {
        "subject": "frog",
        "object": "ship",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "frog",
        "object": "ship",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "moth",
        "object": "ship",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "moth"
    ]
  },
  {
    "id": "medium-9",
    "pace": "medium",
    "skill": "read.digraph-th",
    "text": "The moth is on the ship.",
    "scenes": [
      {
        "subject": "moth",
        "object": "ship",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "moth",
        "object": "ship",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "crab",
        "object": "ship",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "in",
      "crab"
    ]
  },
  {
    "id": "medium-10",
    "pace": "medium",
    "skill": "read.blend-start",
    "text": "The crab is in the shell.",
    "scenes": [
      {
        "subject": "crab",
        "object": "shell",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "crab",
        "object": "shell",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fish",
        "object": "shell",
        "relation": "in",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "fish"
    ]
  },
  {
    "id": "medium-11",
    "pace": "medium",
    "skill": "read.digraph-sh",
    "text": "The fish is under the shell.",
    "scenes": [
      {
        "subject": "fish",
        "object": "shell",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "fish",
        "object": "shell",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "duck",
        "object": "shell",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "duck"
    ]
  },
  {
    "id": "medium-12",
    "pace": "medium",
    "skill": "read.digraph-ck",
    "text": "The little blue duck.",
    "scenes": [
      {
        "subject": "duck",
        "object": "shell",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "duck",
        "object": "shell",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "duck",
        "object": "shell",
        "relation": "beside",
        "color": "red",
        "size": "little"
      }
    ],
    "difference": [
      "",
      "big",
      "red"
    ]
  },
  {
    "id": "medium-13",
    "pace": "medium",
    "skill": "read.blend-start",
    "text": "The big red frog.",
    "scenes": [
      {
        "subject": "frog",
        "object": "shell",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "frog",
        "object": "shell",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "frog",
        "object": "shell",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "blue"
    ]
  },
  {
    "id": "medium-14",
    "pace": "medium",
    "skill": "read.digraph-th",
    "text": "The big blue moth.",
    "scenes": [
      {
        "subject": "moth",
        "object": "shell",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "moth",
        "object": "shell",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "moth",
        "object": "shell",
        "relation": "beside",
        "color": "red",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "red"
    ]
  },
  {
    "id": "medium-15",
    "pace": "medium",
    "skill": "read.blend-start",
    "text": "The little red crab.",
    "scenes": [
      {
        "subject": "crab",
        "object": "dish",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "crab",
        "object": "dish",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "crab",
        "object": "dish",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      }
    ],
    "difference": [
      "",
      "big",
      "blue"
    ]
  },
  {
    "id": "medium-16",
    "pace": "medium",
    "skill": "read.digraph-sh",
    "text": "The big blue fish.",
    "scenes": [
      {
        "subject": "fish",
        "object": "dish",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "fish",
        "object": "dish",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "fish",
        "object": "dish",
        "relation": "beside",
        "color": "red",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "red"
    ]
  },
  {
    "id": "medium-17",
    "pace": "medium",
    "skill": "read.digraph-ck",
    "text": "The big red duck.",
    "scenes": [
      {
        "subject": "duck",
        "object": "dish",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "duck",
        "object": "dish",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "duck",
        "object": "dish",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "blue"
    ]
  },
  {
    "id": "medium-18",
    "pace": "medium",
    "skill": "read.blend-start",
    "text": "The little blue frog.",
    "scenes": [
      {
        "subject": "frog",
        "object": "dish",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "frog",
        "object": "dish",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "frog",
        "object": "dish",
        "relation": "beside",
        "color": "red",
        "size": "little"
      }
    ],
    "difference": [
      "",
      "big",
      "red"
    ]
  },
  {
    "id": "medium-19",
    "pace": "medium",
    "skill": "read.digraph-th",
    "text": "The big red moth.",
    "scenes": [
      {
        "subject": "moth",
        "object": "dish",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "moth",
        "object": "dish",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "moth",
        "object": "dish",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "blue"
    ]
  },
  {
    "id": "hard-0",
    "pace": "hard",
    "skill": "read.vowel-team-oa",
    "text": "The goat is on the boat.",
    "scenes": [
      {
        "subject": "goat",
        "object": "boat",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "goat",
        "object": "boat",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "sheep",
        "object": "boat",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "in",
      "sheep"
    ]
  },
  {
    "id": "hard-1",
    "pace": "hard",
    "skill": "read.vowel-team-ee",
    "text": "The sheep is in the boat.",
    "scenes": [
      {
        "subject": "sheep",
        "object": "boat",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "sheep",
        "object": "boat",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "toad",
        "object": "boat",
        "relation": "in",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "toad"
    ]
  },
  {
    "id": "hard-2",
    "pace": "hard",
    "skill": "read.vowel-team-oa",
    "text": "The toad is under the boat.",
    "scenes": [
      {
        "subject": "toad",
        "object": "boat",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "toad",
        "object": "boat",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "seal",
        "object": "boat",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "seal"
    ]
  },
  {
    "id": "hard-3",
    "pace": "hard",
    "skill": "read.vowel-team-ea",
    "text": "The seal is on the boat.",
    "scenes": [
      {
        "subject": "seal",
        "object": "boat",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "seal",
        "object": "boat",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "bee",
        "object": "boat",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "in",
      "bee"
    ]
  },
  {
    "id": "hard-4",
    "pace": "hard",
    "skill": "read.vowel-team-ee",
    "text": "The bee is in the boat.",
    "scenes": [
      {
        "subject": "bee",
        "object": "boat",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "bee",
        "object": "boat",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "goat",
        "object": "boat",
        "relation": "in",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "goat"
    ]
  },
  {
    "id": "hard-5",
    "pace": "hard",
    "skill": "read.vowel-team-oa",
    "text": "The goat is under the bike.",
    "scenes": [
      {
        "subject": "goat",
        "object": "bike",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "goat",
        "object": "bike",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "sheep",
        "object": "bike",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "sheep"
    ]
  },
  {
    "id": "hard-6",
    "pace": "hard",
    "skill": "read.vowel-team-ee",
    "text": "The sheep is on the bike.",
    "scenes": [
      {
        "subject": "sheep",
        "object": "bike",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "sheep",
        "object": "bike",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "toad",
        "object": "bike",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "toad"
    ]
  },
  {
    "id": "hard-7",
    "pace": "hard",
    "skill": "read.vowel-team-oa",
    "text": "The toad is on the bike.",
    "scenes": [
      {
        "subject": "toad",
        "object": "bike",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "toad",
        "object": "bike",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "seal",
        "object": "bike",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "seal"
    ]
  },
  {
    "id": "hard-8",
    "pace": "hard",
    "skill": "read.vowel-team-ea",
    "text": "The seal is under the bike.",
    "scenes": [
      {
        "subject": "seal",
        "object": "bike",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "seal",
        "object": "bike",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "bee",
        "object": "bike",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "bee"
    ]
  },
  {
    "id": "hard-9",
    "pace": "hard",
    "skill": "read.vowel-team-ee",
    "text": "The bee is on the bike.",
    "scenes": [
      {
        "subject": "bee",
        "object": "bike",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "bee",
        "object": "bike",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "goat",
        "object": "bike",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "under",
      "goat"
    ]
  },
  {
    "id": "hard-10",
    "pace": "hard",
    "skill": "read.vowel-team-oa",
    "text": "The goat is on the tree.",
    "scenes": [
      {
        "subject": "goat",
        "object": "tree",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "goat",
        "object": "tree",
        "relation": "in",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "sheep",
        "object": "tree",
        "relation": "on",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "in",
      "sheep"
    ]
  },
  {
    "id": "hard-11",
    "pace": "hard",
    "skill": "read.vowel-team-ee",
    "text": "The sheep is under the tree.",
    "scenes": [
      {
        "subject": "sheep",
        "object": "tree",
        "relation": "under",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "sheep",
        "object": "tree",
        "relation": "on",
        "color": "coral",
        "size": "big"
      },
      {
        "subject": "toad",
        "object": "tree",
        "relation": "under",
        "color": "coral",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "on",
      "toad"
    ]
  },
  {
    "id": "hard-12",
    "pace": "hard",
    "skill": "read.vowel-team-oa",
    "text": "The little blue toad.",
    "scenes": [
      {
        "subject": "toad",
        "object": "tree",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "toad",
        "object": "tree",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "toad",
        "object": "tree",
        "relation": "beside",
        "color": "red",
        "size": "little"
      }
    ],
    "difference": [
      "",
      "big",
      "red"
    ]
  },
  {
    "id": "hard-13",
    "pace": "hard",
    "skill": "read.vowel-team-ea",
    "text": "The big red seal.",
    "scenes": [
      {
        "subject": "seal",
        "object": "tree",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "seal",
        "object": "tree",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "seal",
        "object": "tree",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "blue"
    ]
  },
  {
    "id": "hard-14",
    "pace": "hard",
    "skill": "read.vowel-team-ee",
    "text": "The big blue bee.",
    "scenes": [
      {
        "subject": "bee",
        "object": "tree",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "bee",
        "object": "tree",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "bee",
        "object": "tree",
        "relation": "beside",
        "color": "red",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "red"
    ]
  },
  {
    "id": "hard-15",
    "pace": "hard",
    "skill": "read.vowel-team-oa",
    "text": "The little red goat.",
    "scenes": [
      {
        "subject": "goat",
        "object": "car",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "goat",
        "object": "car",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "goat",
        "object": "car",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      }
    ],
    "difference": [
      "",
      "big",
      "blue"
    ]
  },
  {
    "id": "hard-16",
    "pace": "hard",
    "skill": "read.vowel-team-ee",
    "text": "The big blue sheep.",
    "scenes": [
      {
        "subject": "sheep",
        "object": "car",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "sheep",
        "object": "car",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "sheep",
        "object": "car",
        "relation": "beside",
        "color": "red",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "red"
    ]
  },
  {
    "id": "hard-17",
    "pace": "hard",
    "skill": "read.vowel-team-oa",
    "text": "The big red toad.",
    "scenes": [
      {
        "subject": "toad",
        "object": "car",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "toad",
        "object": "car",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "toad",
        "object": "car",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "blue"
    ]
  },
  {
    "id": "hard-18",
    "pace": "hard",
    "skill": "read.vowel-team-ea",
    "text": "The little blue seal.",
    "scenes": [
      {
        "subject": "seal",
        "object": "car",
        "relation": "beside",
        "color": "blue",
        "size": "little"
      },
      {
        "subject": "seal",
        "object": "car",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      },
      {
        "subject": "seal",
        "object": "car",
        "relation": "beside",
        "color": "red",
        "size": "little"
      }
    ],
    "difference": [
      "",
      "big",
      "red"
    ]
  },
  {
    "id": "hard-19",
    "pace": "hard",
    "skill": "read.vowel-team-ee",
    "text": "The big red bee.",
    "scenes": [
      {
        "subject": "bee",
        "object": "car",
        "relation": "beside",
        "color": "red",
        "size": "big"
      },
      {
        "subject": "bee",
        "object": "car",
        "relation": "beside",
        "color": "red",
        "size": "little"
      },
      {
        "subject": "bee",
        "object": "car",
        "relation": "beside",
        "color": "blue",
        "size": "big"
      }
    ],
    "difference": [
      "",
      "little",
      "blue"
    ]
  }
];

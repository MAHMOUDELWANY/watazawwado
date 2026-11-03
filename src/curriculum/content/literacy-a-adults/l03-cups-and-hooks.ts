import type { Lesson } from '../../types';
import { lessonAA03TeacherAr } from './l03-teacher-ar.js';

// Map: docs/curriculum/literacy/MAP-adults.md (row 2, Cups and Hooks: ج ح خ د ذ). No religious content (design §4.1).
// Letters wipe in the way the pen moves (slides/motion/g-la3.tsx); letter sounds are the owner's own, words the Fusha clone.

export const lessonAA03: Lesson = {
  "subject": "literacy-a-adults",
  "version": "adults",
  "subjectTitle": "Reading Arabic · Adults",
  "number": 3,
  "title": "Cups and Hooks",
  "titleAr": "الكوب والخطّاف",
  "part": "Part 1 · The Letters",
  "minutes": 45,
  "goal": "By the end of this lesson, you will read and write ح ج خ د ذ, and say the breathy ḥ that English does not have.",
  "reviewed": false,
  "teacherAr": lessonAA03TeacherAr,
  "outcomes": [
    "Says the sounds of ح ج خ د ذ.",
    "Writes the cup and the hook bodies from the right, dots last.",
    "Tells ح ج خ and د ذ apart by their dots.",
    "Spots the letters that never join the next one (ا د ذ).",
    "Finds today's letters inside تَاجٌ، دَجَاجٌ، ذُبَابٌ."
  ],
  "chapters": [
    {
      "label": "The shapes",
      "page": 0
    },
    {
      "label": "Cups",
      "page": 2
    },
    {
      "label": "Hooks",
      "page": 4
    },
    {
      "label": "Practice",
      "page": 6
    },
    {
      "label": "My mission",
      "page": 9
    }
  ],
  "pages": [
    {
      "title": "Cups and Hooks",
      "station": "spark",
      "layout": "cover",
      "scene": "lt3Cover",
      "lines": [],
      "explain": [
        "Ask for the photo from the mission and let the learner find ب ت ث in it.",
        "Today: five new letters, and one sound English does not have."
      ]
    },
    {
      "title": "Back to the sign",
      "station": "spark",
      "layout": "story",
      "scene": "lt3Message",
      "lines": [
        "Back to the shop sign. You can already find ب ت ث in it.",
        "Five new shapes today: three cups and two hooks.",
        "The same idea as last time: learn the body once, then read the dots."
      ],
      "explain": [
        "Let the learner find the cups and the hooks before you name them."
      ]
    },
    {
      "title": "The cup family",
      "station": "zad",
      "layout": "concept",
      "scene": "lt3Cups",
      "lines": [
        "No dot: ح, a breathy h.",
        "A dot inside: ج, j as in jam.",
        "A dot on top: خ, kh, a soft gargle."
      ],
      "vocab": [
        {
          "arabic": "ح",
          "translit": "ḥaa",
          "meaning": "the letter haa"
        },
        {
          "arabic": "ج",
          "translit": "jeem",
          "meaning": "the letter jeem"
        },
        {
          "arabic": "خ",
          "translit": "khaa",
          "meaning": "the letter khaa"
        }
      ],
      "say": [
        {
          "id": "hhaa",
          "text": "ح",
          "voice": "owner",
          "emotion": "clear"
        },
        {
          "id": "jeem",
          "text": "ج",
          "voice": "owner",
          "emotion": "clear"
        },
        {
          "id": "khaa",
          "text": "خ",
          "voice": "owner",
          "emotion": "clear"
        }
      ],
      "explain": [
        "Write the cup from the right: a short roof, then the round bowl. Body first, dot last.",
        "Tap each letter to hear it, and repeat."
      ]
    },
    {
      "title": "The sound English does not have",
      "station": "zad",
      "layout": "concept",
      "scene": "lt3Haa",
      "lines": [
        "ح is not the English h. It comes from the middle of the throat.",
        "Breathe out as if you were fogging up a mirror: ḥaa.",
        "Then say h, ḥ, h, ḥ, and feel the difference."
      ],
      "say": [
        {
          "id": "hhaa",
          "text": "ح",
          "voice": "owner",
          "emotion": "clear"
        }
      ],
      "explain": [
        "Most learners say a plain h at first. Ask for a warmer, stronger breath, with the throat a little narrow.",
        "Do not push for perfection today: hearing the difference is the goal."
      ],
      "teacherNote": "The full makharij come much later. Here: a breathy h, felt in the throat."
    },
    {
      "title": "The hooks",
      "station": "zad",
      "layout": "concept",
      "scene": "lt3Hooks",
      "lines": [
        "د is a little hook. It says d.",
        "Add a dot on top and it becomes ذ: dh, as in \"this\".",
        "The same dots idea, on a new body."
      ],
      "vocab": [
        {
          "arabic": "د",
          "translit": "daal",
          "meaning": "the letter daal"
        },
        {
          "arabic": "ذ",
          "translit": "dhaal",
          "meaning": "the letter dhaal"
        }
      ],
      "say": [
        {
          "id": "daal",
          "text": "د",
          "voice": "owner",
          "emotion": "clear"
        },
        {
          "id": "dhaal",
          "text": "ذ",
          "voice": "owner",
          "emotion": "clear"
        }
      ],
      "explain": [
        "Write the hook in one stroke from the top, then along the line to the left.",
        "For ذ the tongue peeks between the teeth, as in \"this\"."
      ]
    },
    {
      "title": "Letters that let go",
      "station": "zad",
      "layout": "concept",
      "scene": "lt3Rule",
      "lines": [
        "Most letters hold hands with the next one. A few never do.",
        "Alif and the hooks let go: look at the gaps in دَجَاجٌ, chicken.",
        "That gap is a clue: the letter before it is one of the letting-go letters."
      ],
      "explain": [
        "Point at each gap in دَجَاجٌ and name the letter before it: د, then ا.",
        "Joining comes fully in Part 2; today, only the gaps."
      ],
      "teacherNote": "The six non-joining letters (ا د ذ ر ز و) are previewed here; ر ز و come later."
    },
    {
      "title": "Find the letter",
      "station": "athar",
      "layout": "question",
      "scene": "lt3Find",
      "lines": [
        "Find the cups with a dot inside."
      ],
      "interaction": {
        "kind": "clues",
        "prompt": "Tap every letter that says \"j\".",
        "clues": [
          {
            "label": "ج",
            "correct": true
          },
          {
            "label": "ح",
            "correct": false
          },
          {
            "label": "خ",
            "correct": false
          },
          {
            "label": "ج",
            "correct": true
          },
          {
            "label": "ب",
            "correct": false
          },
          {
            "label": "ح",
            "correct": false
          }
        ]
      },
      "explain": [
        "Look inside the cup first, then tap."
      ]
    },
    {
      "title": "Short review",
      "station": "athar",
      "layout": "game",
      "scene": "lt3Sort",
      "lines": [],
      "interaction": {
        "kind": "sort",
        "look": "row",
        "prompt": "Which sound does each letter make?",
        "bins": [
          {
            "id": "j",
            "label": "j",
            "hint": "dot inside"
          },
          {
            "id": "h",
            "label": "ḥ",
            "hint": "no dot"
          },
          {
            "id": "kh",
            "label": "kh",
            "hint": "dot on top"
          },
          {
            "id": "d",
            "label": "d / dh",
            "hint": "the hooks"
          }
        ],
        "cards": [
          {
            "label": "ج",
            "bin": "j",
            "why": "A dot inside the cup: jeem."
          },
          {
            "label": "خ",
            "bin": "kh",
            "why": "A dot on top of the cup: khaa."
          },
          {
            "label": "د",
            "bin": "d",
            "why": "The hook with no dot: daal."
          },
          {
            "label": "ح",
            "bin": "h",
            "why": "The cup with no dot: the breathy haa."
          },
          {
            "label": "ذ",
            "bin": "d",
            "why": "The hook with a dot: dhaal."
          },
          {
            "label": "ج",
            "bin": "j",
            "why": "Dot inside again: j."
          },
          {
            "label": "خ",
            "bin": "kh",
            "why": "Dot on top: kh."
          }
        ]
      },
      "explain": [
        "A short review, no points. The learner says each sound aloud before choosing."
      ],
      "teacherNote": "The result is added to your lesson report automatically."
    },
    {
      "title": "Three words",
      "station": "athar",
      "layout": "concept",
      "scene": "lt3Words",
      "lines": [
        "تَاجٌ, taajun: a crown.",
        "دَجَاجٌ, dajaajun: chicken. Find the two gaps.",
        "ذُبَابٌ, dhubaabun: flies."
      ],
      "vocab": [
        {
          "arabic": "تَاجٌ",
          "translit": "taajun",
          "meaning": "crown"
        },
        {
          "arabic": "دَجَاجٌ",
          "translit": "dajaajun",
          "meaning": "chicken"
        },
        {
          "arabic": "ذُبَابٌ",
          "translit": "dhubaabun",
          "meaning": "flies"
        }
      ],
      "say": [
        {
          "id": "taaj",
          "text": "تَاجٌ",
          "voice": "fusha",
          "emotion": "proud"
        },
        {
          "id": "dajaaj",
          "text": "دَجَاجٌ",
          "voice": "fusha",
          "emotion": "amused"
        },
        {
          "id": "dhubaab",
          "text": "ذُبَابٌ",
          "voice": "fusha",
          "emotion": "amused"
        }
      ],
      "explain": [
        "Read each word for the learner first: the small vowel marks come in Lesson 12. Today they find the letters inside the words."
      ]
    },
    {
      "title": "My mission",
      "station": "ahd",
      "layout": "mission",
      "scene": "lt3Mission",
      "lines": [
        "This week, photograph a sign or label with at least two of today's letters.",
        "Bring it next time and read the letters to your teacher."
      ],
      "interaction": {
        "kind": "choose",
        "prompt": "Where will you look first?",
        "options": [
          "A shop sign",
          "A food label",
          "A menu",
          "Something at home"
        ]
      },
      "explain": [
        "Start the next lesson with the photo."
      ]
    },
    {
      "title": "Next time…",
      "station": "ahd",
      "layout": "next",
      "scene": "lt3Next",
      "lines": [
        "Next family: letters with tails, and letters with teeth.",
        "Two of them are hooks that dip below the line.",
        "Next time: ر ز س ش."
      ],
      "explain": [
        "End on the new shapes. Ask the learner to guess which dots will appear."
      ]
    }
  ]
};

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { saveResult } from "@/lib/game";

type Question = {
  question: string;
  options: string[];
  answer: number;
};

type QuizStatus = "ready" | "playing" | "finished";

const PROGRESSION_KEY = "gamehub-quiz-stage";
const BEST_SCORE_KEY = "gamehub-quiz-best-score";

const QUESTIONS_PER_SESSION = 5;
const TOTAL_INTERNAL_STAGES = 15;

/* ==========================================================================
   Internal Question Pools
   --------------------------------------------------------------------------
   These categories/stages are intentionally NOT exposed to the player.
   15 pools × 5 questions = 75 questions.
   ========================================================================== */

const QUESTION_POOLS: Question[][] = [
  /* ------------------------------------------------------------------------
     Internal Pool 1 — General Knowledge
     ------------------------------------------------------------------------ */
  [
    {
      question: "Which planet is the largest in our solar system?",
      options: ["Earth", "Jupiter", "Saturn", "Neptune"],
      answer: 1,
    },
    {
      question: "How many continents are there?",
      options: ["5", "6", "7", "8"],
      answer: 2,
    },
    {
      question: "What is the capital of France?",
      options: ["Madrid", "Rome", "Berlin", "Paris"],
      answer: 3,
    },
    {
      question: "Which ocean is the largest?",
      options: [
        "Atlantic Ocean",
        "Indian Ocean",
        "Pacific Ocean",
        "Arctic Ocean",
      ],
      answer: 2,
    },
    {
      question: "How many sides does a hexagon have?",
      options: ["5", "6", "7", "8"],
      answer: 1,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 2 — Science & Nature
     ------------------------------------------------------------------------ */
  [
    {
      question: "What gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
      answer: 2,
    },
    {
      question: "What is H₂O commonly known as?",
      options: ["Salt", "Water", "Oxygen", "Hydrogen"],
      answer: 1,
    },
    {
      question: "Which organ pumps blood around the human body?",
      options: ["Brain", "Liver", "Lung", "Heart"],
      answer: 3,
    },
    {
      question: "What force keeps objects attracted to Earth?",
      options: ["Magnetism", "Gravity", "Friction", "Pressure"],
      answer: 1,
    },
    {
      question: "Which animal is the largest living mammal?",
      options: [
        "African Elephant",
        "Blue Whale",
        "Giraffe",
        "Polar Bear",
      ],
      answer: 1,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 3 — Technology
     ------------------------------------------------------------------------ */
  [
    {
      question: "What does CPU stand for?",
      options: [
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Program Utility",
        "Core Processing Utility",
      ],
      answer: 0,
    },
    {
      question: "Which language is primarily used to style web pages?",
      options: ["HTML", "CSS", "SQL", "Python"],
      answer: 1,
    },
    {
      question: "What does URL stand for?",
      options: [
        "Universal Resource Link",
        "Uniform Resource Locator",
        "User Resource Location",
        "Unified Routing Link",
      ],
      answer: 1,
    },
    {
      question: "Which company developed the Android operating system?",
      options: ["Microsoft", "Apple", "Google", "IBM"],
      answer: 2,
    },
    {
      question: "What does RAM primarily provide?",
      options: [
        "Temporary working memory",
        "Permanent file storage",
        "Internet connectivity",
        "Power management",
      ],
      answer: 0,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 4 — Geography
     ------------------------------------------------------------------------ */
  [
    {
      question: "Which country is the largest by land area?",
      options: ["Canada", "China", "Russia", "United States"],
      answer: 2,
    },
    {
      question: "What is the capital of Japan?",
      options: ["Kyoto", "Tokyo", "Osaka", "Hiroshima"],
      answer: 1,
    },
    {
      question: "The Sahara Desert is located primarily on which continent?",
      options: ["Asia", "Africa", "Australia", "South America"],
      answer: 1,
    },
    {
      question: "Which country is often described as being shaped like a boot?",
      options: ["Greece", "Italy", "Portugal", "Chile"],
      answer: 1,
    },
    {
      question: "Mount Everest is part of which mountain range?",
      options: ["Andes", "Alps", "Himalayas", "Rockies"],
      answer: 2,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 5 — History
     ------------------------------------------------------------------------ */
  [
    {
      question: "Who was the first person to walk on the Moon?",
      options: [
        "Buzz Aldrin",
        "Neil Armstrong",
        "Yuri Gagarin",
        "John Glenn",
      ],
      answer: 1,
    },
    {
      question: "The Great Wall is located in which country?",
      options: ["India", "China", "Japan", "Mongolia"],
      answer: 1,
    },
    {
      question: "Which ancient civilization built the pyramids at Giza?",
      options: ["Romans", "Greeks", "Egyptians", "Persians"],
      answer: 2,
    },
    {
      question: "Who was known as the Maid of Orléans?",
      options: [
        "Cleopatra",
        "Joan of Arc",
        "Marie Curie",
        "Queen Victoria",
      ],
      answer: 1,
    },
    {
      question: "The Renaissance began primarily in which country?",
      options: ["France", "Italy", "Germany", "Spain"],
      answer: 1,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 6 — Sports
     ------------------------------------------------------------------------ */
  [
    {
      question: "How many players are on the field for one soccer team?",
      options: ["9", "10", "11", "12"],
      answer: 2,
    },
    {
      question: "Which sport uses a shuttlecock?",
      options: ["Tennis", "Badminton", "Squash", "Volleyball"],
      answer: 1,
    },
    {
      question: "How many rings are on the Olympic symbol?",
      options: ["4", "5", "6", "7"],
      answer: 1,
    },
    {
      question: "In basketball, how many points is a free throw worth?",
      options: ["1", "2", "3", "4"],
      answer: 0,
    },
    {
      question: "Which sport is associated with Wimbledon?",
      options: ["Golf", "Tennis", "Cricket", "Rugby"],
      answer: 1,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 7 — Movies & Games
     ------------------------------------------------------------------------ */
  [
    {
      question: "Which game features the character Mario?",
      options: ["Minecraft", "Super Mario", "Fortnite", "Tetris"],
      answer: 1,
    },
    {
      question: "Which fictional city is Batman primarily associated with?",
      options: ["Metropolis", "Gotham City", "Star City", "Central City"],
      answer: 1,
    },
    {
      question: "Which game is famous for falling blocks?",
      options: ["Tetris", "Pac-Man", "Snake", "Pong"],
      answer: 0,
    },
    {
      question: "What color is Sonic the Hedgehog?",
      options: ["Red", "Green", "Blue", "Yellow"],
      answer: 2,
    },
    {
      question: "Which movie franchise features Darth Vader?",
      options: [
        "Star Wars",
        "The Matrix",
        "Jurassic Park",
        "Harry Potter",
      ],
      answer: 0,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 8 — Logic & Reasoning
     ------------------------------------------------------------------------ */
  [
    {
      question: "What number comes next: 2, 4, 6, 8, ?",
      options: ["9", "10", "11", "12"],
      answer: 1,
    },
    {
      question:
        "If all roses are flowers, which statement must be true?",
      options: [
        "All flowers are roses",
        "Roses are flowers",
        "No roses are flowers",
        "Some roses are not flowers",
      ],
      answer: 1,
    },
    {
      question: "Which number does not belong: 3, 6, 9, 12, 14?",
      options: ["3", "9", "12", "14"],
      answer: 3,
    },
    {
      question: "What is half of 50 plus 10?",
      options: ["25", "30", "35", "40"],
      answer: 1,
    },
    {
      question: "A clock shows 3:00. What is the angle between its hands?",
      options: ["45°", "60°", "90°", "180°"],
      answer: 2,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 9 — Art & Culture
     ------------------------------------------------------------------------ */
  [
    {
      question: "Who painted the Mona Lisa?",
      options: [
        "Vincent van Gogh",
        "Leonardo da Vinci",
        "Pablo Picasso",
        "Claude Monet",
      ],
      answer: 1,
    },
    {
      question: "Which instrument traditionally has 88 keys?",
      options: ["Violin", "Flute", "Piano", "Guitar"],
      answer: 2,
    },
    {
      question: "Which art movement is strongly associated with Claude Monet?",
      options: [
        "Impressionism",
        "Cubism",
        "Surrealism",
        "Pop Art",
      ],
      answer: 0,
    },
    {
      question: "Which material is traditionally used for many classical sculptures?",
      options: ["Marble", "Cotton", "Paper", "Rubber"],
      answer: 0,
    },
    {
      question: "A haiku traditionally originates from which country?",
      options: ["Japan", "Brazil", "Egypt", "Canada"],
      answer: 0,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 10 — Mixed Knowledge
     ------------------------------------------------------------------------ */
  [
    {
      question: "Which element has the chemical symbol Au?",
      options: ["Silver", "Gold", "Copper", "Iron"],
      answer: 1,
    },
    {
      question: "Which is the fastest land animal?",
      options: ["Lion", "Horse", "Cheetah", "Leopard"],
      answer: 2,
    },
    {
      question: "What is 12 × 8?",
      options: ["86", "96", "108", "112"],
      answer: 1,
    },
    {
      question: "Which device measures temperature?",
      options: ["Barometer", "Thermometer", "Altimeter", "Compass"],
      answer: 1,
    },
    {
      question: "Which language has the most native speakers worldwide?",
      options: ["English", "Spanish", "Mandarin Chinese", "French"],
      answer: 2,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 11 — Space & Astronomy
     ------------------------------------------------------------------------ */
  [
    {
      question: "What is the closest star to Earth?",
      options: ["Sirius", "The Sun", "Polaris", "Betelgeuse"],
      answer: 1,
    },
    {
      question: "Which planet is known for its prominent ring system?",
      options: ["Mars", "Venus", "Saturn", "Mercury"],
      answer: 2,
    },
    {
      question: "What galaxy contains our solar system?",
      options: [
        "Andromeda Galaxy",
        "Milky Way",
        "Whirlpool Galaxy",
        "Sombrero Galaxy",
      ],
      answer: 1,
    },
    {
      question: "What is Earth's natural satellite?",
      options: ["Mars", "The Moon", "Venus", "Titan"],
      answer: 1,
    },
    {
      question: "Which planet is closest to the Sun?",
      options: ["Earth", "Venus", "Mercury", "Mars"],
      answer: 2,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 12 — Animals & Wildlife
     ------------------------------------------------------------------------ */
  [
    {
      question: "Which animal is commonly known as the king of the jungle?",
      options: ["Tiger", "Lion", "Leopard", "Jaguar"],
      answer: 1,
    },
    {
      question: "Which bird is famous for its ability to mimic human speech?",
      options: ["Parrot", "Penguin", "Ostrich", "Eagle"],
      answer: 0,
    },
    {
      question: "What is a baby frog called?",
      options: ["Cub", "Calf", "Tadpole", "Chick"],
      answer: 2,
    },
    {
      question: "Which animal is known for changing its color for camouflage?",
      options: ["Chameleon", "Elephant", "Horse", "Panda"],
      answer: 0,
    },
    {
      question: "Which mammal is capable of true sustained flight?",
      options: ["Flying squirrel", "Bat", "Penguin", "Ostrich"],
      answer: 1,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 13 — Inventions & Discoveries
     ------------------------------------------------------------------------ */
  [
    {
      question: "Who is commonly credited with inventing the practical telephone?",
      options: [
        "Alexander Graham Bell",
        "Thomas Edison",
        "Nikola Tesla",
        "James Watt",
      ],
      answer: 0,
    },
    {
      question: "Who developed the theory of relativity?",
      options: [
        "Isaac Newton",
        "Albert Einstein",
        "Galileo Galilei",
        "Stephen Hawking",
      ],
      answer: 1,
    },
    {
      question: "Which invention is strongly associated with Johannes Gutenberg?",
      options: [
        "Steam engine",
        "Printing press",
        "Telephone",
        "Light bulb",
      ],
      answer: 1,
    },
    {
      question: "Who is famous for developing an early practical incandescent light bulb?",
      options: [
        "Thomas Edison",
        "Charles Darwin",
        "Louis Pasteur",
        "Alexander Fleming",
      ],
      answer: 0,
    },
    {
      question: "Penicillin is associated with which scientist?",
      options: [
        "Alexander Fleming",
        "Isaac Newton",
        "Galileo Galilei",
        "Gregor Mendel",
      ],
      answer: 0,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 14 — Language & Literature
     ------------------------------------------------------------------------ */
  [
    {
      question: "Who wrote Romeo and Juliet?",
      options: [
        "William Shakespeare",
        "Charles Dickens",
        "Jane Austen",
        "Mark Twain",
      ],
      answer: 0,
    },
    {
      question: "Which word is a synonym for 'rapid'?",
      options: ["Slow", "Quick", "Heavy", "Quiet"],
      answer: 1,
    },
    {
      question: "How many letters are in the English alphabet?",
      options: ["24", "25", "26", "27"],
      answer: 2,
    },
    {
      question: "Which of these is a noun?",
      options: ["Beautiful", "Run", "Happiness", "Quickly"],
      answer: 2,
    },
    {
      question: "Who wrote the Harry Potter book series?",
      options: [
        "J. K. Rowling",
        "Suzanne Collins",
        "J. R. R. Tolkien",
        "Agatha Christie",
      ],
      answer: 0,
    },
  ],

  /* ------------------------------------------------------------------------
     Internal Pool 15 — World & Everyday Knowledge
     ------------------------------------------------------------------------ */
  [
    {
      question: "How many minutes are in one hour?",
      options: ["30", "45", "60", "90"],
      answer: 2,
    },
    {
      question: "Which direction does the Sun generally rise from?",
      options: ["North", "South", "East", "West"],
      answer: 2,
    },
    {
      question: "What is the main ingredient in traditional bread?",
      options: ["Flour", "Rice", "Potato", "Corn syrup"],
      answer: 0,
    },
    {
      question: "Which tool is commonly used to measure length?",
      options: ["Thermometer", "Ruler", "Compass", "Scale"],
      answer: 1,
    },
    {
      question: "How many days are there in a standard year?",
      options: ["360", "364", "365", "366"],
      answer: 2,
    },
  ],
];

/* ==========================================================================
   Helpers
   ========================================================================== */

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1),
    );

    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

function getSavedStage(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = Number(
    localStorage.getItem(PROGRESSION_KEY),
  );

  if (
    Number.isInteger(stored) &&
    stored >= 0 &&
    stored < TOTAL_INTERNAL_STAGES
  ) {
    return stored;
  }

  return 0;
}

function getSavedBestScore(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = Number(
    localStorage.getItem(BEST_SCORE_KEY),
  );

  if (Number.isFinite(stored) && stored >= 0) {
    return stored;
  }

  return 0;
}

/* ==========================================================================
   Main Quiz
   ========================================================================== */

export default function QuizPage() {
  const [status, setStatus] =
    useState<QuizStatus>("ready");

  /*
   * This is an INTERNAL stage index only.
   * It is deliberately never displayed to the player.
   */
  const [stage, setStage] = useState(0);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [questionIndex, setQuestionIndex] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null);

  const [score, setScore] = useState(0);

  const [bestScore, setBestScore] =
    useState(0);

  const [hasPlayed, setHasPlayed] =
    useState(false);

  useEffect(() => {
    setStage(getSavedStage());
    setBestScore(getSavedBestScore());
  }, []);

  const currentQuestion =
    questions[questionIndex];

  /*
   * A deliberately subtle progress indicator.
   * We show progress within the current challenge,
   * but never reveal the 15-stage architecture.
   */
  const progress = Math.round(
    ((questionIndex + 1) /
      QUESTIONS_PER_SESSION) *
      100,
  );

  const currentScore = score;

  const answerWasSelected =
    selectedAnswer !== null;

  const selectedAnswerIsCorrect =
    currentQuestion &&
    selectedAnswer === currentQuestion.answer;

  /* ------------------------------------------------------------------------
     Start
     ------------------------------------------------------------------------ */

  function startQuiz() {
    /*
     * The current internal pool is selected silently.
     * Questions are randomized so the same pool does not
     * always feel identical.
     */
    const pool =
      QUESTION_POOLS[stage] ??
      QUESTION_POOLS[0];

    setQuestions(shuffle(pool));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setHasPlayed(true);
    setStatus("playing");
  }

  /* ------------------------------------------------------------------------
     Select Answer
     ------------------------------------------------------------------------ */

  function selectAnswer(index: number) {
    if (
      status !== "playing" ||
      selectedAnswer !== null ||
      !currentQuestion
    ) {
      return;
    }

    setSelectedAnswer(index);

    if (index === currentQuestion.answer) {
      setScore((current) => current + 1);
    }
  }

  /* ------------------------------------------------------------------------
     Next Question
     ------------------------------------------------------------------------ */

  function goToNextQuestion() {
    if (
      !currentQuestion ||
      selectedAnswer === null
    ) {
      return;
    }

    const finalQuestion =
      questionIndex ===
      QUESTIONS_PER_SESSION - 1;

    if (finalQuestion) {
      finishQuiz();
      return;
    }

    setQuestionIndex((current) => current + 1);
    setSelectedAnswer(null);
  }

  /* ------------------------------------------------------------------------
     Finish Quiz
     ------------------------------------------------------------------------ */

  function finishQuiz() {
    if (!currentQuestion) {
      return;
    }

    /*
     * React state updates are asynchronous, so calculate the
     * final score directly from the current answer.
     */
    const finalScore =
      score +
      (selectedAnswer === currentQuestion.answer
        ? 1
        : 0);

    setScore(finalScore);
    setStatus("finished");

    /*
     * Persist best score.
     */
    const nextBestScore = Math.max(
      bestScore,
      finalScore,
    );

    setBestScore(nextBestScore);

    localStorage.setItem(
      BEST_SCORE_KEY,
      String(nextBestScore),
    );

    /*
     * Silently advance the internal progression.
     *
     * Stage 0 → 1 → 2 → ... → 14 → 0
     *
     * Nothing about this is exposed in the UI.
     */
    const nextStage =
      (stage + 1) % TOTAL_INTERNAL_STAGES;

    setStage(nextStage);

    localStorage.setItem(
      PROGRESSION_KEY,
      String(nextStage),
    );

    /*
     * A score of 3 or more is treated as a successful
     * quiz completion for the existing GameHub stats system.
     */
    saveResult(
      finalScore >= 3 ? "win" : "loss",
      finalScore,
    );
  }

  /* ------------------------------------------------------------------------
     Reset
     ------------------------------------------------------------------------ */

  function resetProgress() {
    localStorage.removeItem(PROGRESSION_KEY);
    localStorage.removeItem(BEST_SCORE_KEY);

    setStage(0);
    setBestScore(0);
    setQuestions([]);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setHasPlayed(false);
    setStatus("ready");
  }

  /* ==========================================================================
     READY SCREEN
     ========================================================================== */

  if (status === "ready") {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <PageHeader />

          <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_24px_70px_var(--shadow-color)] sm:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />

            <div className="relative">
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                    <span>🧠</span>
                    <span>Knowledge Challenge</span>
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                    ⚡ Quick Quiz
                  </h1>

                  <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                    Test your knowledge, learn something new,
                    and see how high you can score.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <InfoBadge
                      icon="❓"
                      text="Fresh Questions"
                    />

                    <InfoBadge
                      icon="🎯"
                      text="Instant Feedback"
                    />

                    <InfoBadge
                      icon="🏆"
                      text="Track Your Best"
                    />
                  </div>
                </div>

                <div className="flex justify-start md:justify-end">
                  <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-teal-500/20 bg-[var(--primary-soft)] text-6xl shadow-inner sm:h-40 sm:w-40 sm:text-7xl">
                    🧠
                  </div>
                </div>
              </div>

              <div className="mt-9 grid gap-4 border-t border-[var(--border)] pt-7 sm:grid-cols-3">
                <StatCard
                  icon="🎯"
                  label="Best Score"
                  value={`${bestScore}/5`}
                />

                <StatCard
                  icon="✨"
                  label="Challenge"
                  value="Fresh"
                />

                <StatCard
                  icon="🧩"
                  label="Questions"
                  value="5"
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={startQuiz}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-[var(--primary-dark)] active:scale-[0.98]"
                >
                  {hasPlayed
                    ? "Play Again"
                    : "Start Quiz"}{" "}
                  →
                </button>

                <button
                  type="button"
                  onClick={resetProgress}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-6 py-3 text-sm font-semibold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  Reset Progress
                </button>
              </div>
            </div>
          </section>

          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>

              <div>
                <h2 className="text-sm font-bold">
                  Every run is a little different
                </h2>

                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Questions are continuously rotated through
                  different areas of knowledge, so you never know
                  exactly what challenge comes next.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================================
     FINISHED SCREEN
     ========================================================================== */

  if (status === "finished") {
    const perfect =
      score === QUESTIONS_PER_SESSION;

    const strong =
      score >= 4;

    const message = perfect
      ? "Perfect run!"
      : strong
        ? "Excellent work!"
        : score >= 3
          ? "Nice job!"
          : "Keep practicing!";

    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <PageHeader />

          <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_70px_var(--shadow-color)]">
            <div className="bg-gradient-to-br from-teal-500/15 via-transparent to-blue-500/10 p-7 text-center sm:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--primary-soft)] text-4xl">
                {perfect
                  ? "🏆"
                  : strong
                    ? "🎉"
                    : score >= 3
                      ? "👏"
                      : "💪"}
              </div>

              <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-[var(--primary)]">
                Challenge Complete
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {message}
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                You finished the challenge. Ready to test
                yourself again?
              </p>

              <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
                <ResultStat
                  label="Score"
                  value={`${score}/5`}
                />

                <ResultStat
                  label="Accuracy"
                  value={`${score * 20}%`}
                />

                <ResultStat
                  label="Best"
                  value={`${bestScore}/5`}
                />
              </div>
            </div>

            <div className="border-t border-[var(--border)] p-6 sm:p-8">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-xl">
                    🧠
                  </div>

                  <div>
                    <h2 className="text-sm font-bold">
                      Your next challenge is waiting
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      New knowledge questions are ready. Keep
                      playing to discover different topics and
                      improve your score.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    startQuiz();
                  }}
                  className="flex-1 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-[var(--primary-dark)] active:scale-[0.98]"
                >
                  New Challenge →
                </button>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  Back to Games
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* ==========================================================================
     PLAYING SCREEN
     ========================================================================== */

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader />

        <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_70px_var(--shadow-color)]">
          {/* ------------------------------------------------------------------
             Header
             ------------------------------------------------------------------ */}

          <div className="border-b border-[var(--border)] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-lg">
                    🧠
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Quick Quiz
                    </p>

                    <h1 className="text-base font-bold">
                      Knowledge Challenge
                    </h1>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-[var(--muted)]">
                  Question
                </p>

                <p className="text-lg font-bold">
                  {questionIndex + 1}
                  <span className="mx-1 text-[var(--muted)]">
                    /
                  </span>
                  {QUESTIONS_PER_SESSION}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--muted)]">
                  Progress
                </span>

                <span className="font-bold text-[var(--primary)]">
                  {progress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
             Question
             ------------------------------------------------------------------ */}

          <div className="p-5 sm:p-8">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                Question {questionIndex + 1}
              </p>

              <h2 className="mt-3 text-xl font-bold leading-8 tracking-tight sm:text-2xl">
                {currentQuestion?.question}
              </h2>
            </div>

            {/* ----------------------------------------------------------------
               Answers
               ---------------------------------------------------------------- */}

            <div className="mt-5 grid gap-3">
              {currentQuestion?.options.map(
                (option, index) => {
                  const isSelected =
                    selectedAnswer === index;

                  const isCorrect =
                    index === currentQuestion.answer;

                  let answerClass =
                    "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]";

                  if (
                    answerWasSelected &&
                    isCorrect
                  ) {
                    answerClass =
                      "border-emerald-500 bg-emerald-500/10";
                  } else if (
                    isSelected &&
                    !isCorrect
                  ) {
                    answerClass =
                      "border-red-500 bg-red-500/10";
                  }

                  let letterClass =
                    "border-[var(--border)] bg-[var(--surface-soft)] group-hover:border-[var(--primary)] group-hover:text-[var(--primary)]";

                  if (
                    answerWasSelected &&
                    isCorrect
                  ) {
                    letterClass =
                      "border-emerald-500 bg-emerald-500 text-white";
                  } else if (
                    isSelected &&
                    !isCorrect
                  ) {
                    letterClass =
                      "border-red-500 bg-red-500 text-white";
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        selectAnswer(index)
                      }
                      disabled={answerWasSelected}
                      className={`group flex min-h-14 w-full items-center gap-4 rounded-2xl border p-4 text-left transition active:scale-[0.995] disabled:cursor-default ${answerClass}`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition ${letterClass}`}
                      >
                        {String.fromCharCode(
                          65 + index,
                        )}
                      </span>

                      <span className="flex-1 text-sm font-medium leading-6 sm:text-base">
                        {option}
                      </span>

                      {answerWasSelected &&
                        isCorrect && (
                          <span className="text-lg text-emerald-500">
                            ✓
                          </span>
                        )}

                      {isSelected &&
                        !isCorrect && (
                          <span className="text-lg text-red-500">
                            ✕
                          </span>
                        )}
                    </button>
                  );
                },
              )}
            </div>

            {/* ----------------------------------------------------------------
               Feedback
               ---------------------------------------------------------------- */}

            {answerWasSelected && (
              <div
                className={`mt-5 rounded-2xl border p-4 ${
                  selectedAnswerIsCorrect
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    {selectedAnswerIsCorrect
                      ? "✅"
                      : "❌"}
                  </span>

                  <div>
                    <p className="text-sm font-bold">
                      {selectedAnswerIsCorrect
                        ? "Correct!"
                        : "Not quite."}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {selectedAnswerIsCorrect
                        ? "Excellent. Keep going!"
                        : `The correct answer is "${currentQuestion?.options[currentQuestion.answer]}".`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------
               Bottom Controls
               ---------------------------------------------------------------- */}

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="text-xs text-[var(--muted)]">
                Score:{" "}
                <span className="font-bold text-[var(--foreground)]">
                  {currentScore}
                </span>
              </div>

              <button
                type="button"
                onClick={goToNextQuestion}
                disabled={!answerWasSelected}
                className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {questionIndex ===
                QUESTIONS_PER_SESSION - 1
                  ? "Finish"
                  : "Next"}{" "}
                →
              </button>
            </div>
          </div>
        </section>

        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Every new challenge brings a different mix of
          knowledge.
        </p>
      </div>
    </main>
  );
}

/* ==========================================================================
   Page Header
   ========================================================================== */

function PageHeader() {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link
            href="/"
            className="transition hover:text-[var(--primary)]"
          >
            GameHub
          </Link>

          <span>/</span>

          <span>Quick Quiz</span>
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex shrink-0 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold transition hover:border-[var(--primary)] hover:text-[var(--primary)] sm:px-4 sm:text-sm"
      >
        ← Games
      </Link>
    </div>
  );
}

/* ==========================================================================
   Info Badge
   ========================================================================== */

function InfoBadge({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/* ==========================================================================
   Stat Card
   ========================================================================== */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--muted)]">
          {label}
        </p>

        <span>{icon}</span>
      </div>

      <p className="mt-1 text-xl font-bold tracking-tight">
        {value}
      </p>
    </div>
  );
}

/* ==========================================================================
   Result Stat
   ========================================================================== */

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs font-medium text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}
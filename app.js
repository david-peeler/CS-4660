const frameworkLanes = [
  {
    tone: "green",
    label: "Green Light",
    title: "Allowed",
    description:
      "Use AI for practice, brainstorming, study support, and feedback on work you already started."
  },
  {
    tone: "gold",
    label: "Yellow Light",
    title: "Allowed With Limits",
    description:
      "Use AI for hints, debugging help, or revision support only if you verify the output and keep the final thinking your own."
  },
  {
    tone: "red",
    label: "Red Light",
    title: "Not Allowed",
    description:
      "Do not ask AI to produce final answers, full solutions, or ready-to-submit work for a graded task."
  }
];

const playersTemplate = [
  { id: "you", name: "You", note: "Student player", skill: 0.72, score: 0, streak: 0 },
  { id: "maya", name: "Maya", note: "Fast verifier", skill: 0.68, score: 0, streak: 0 },
  { id: "leo", name: "Leo", note: "Code checker", skill: 0.74, score: 0, streak: 0 },
  { id: "sana", name: "Sana", note: "Policy reader", skill: 0.7, score: 0, streak: 0 }
];

const ROUND_TIME_MULTIPLIER = 3;

const scaffoldingByCategory = {
  "CS Hallucinations": {
    title: "Trust official docs and tools more than confident wording",
    items: [
      "Check API names, methods, syntax, and references in official docs or trusted tools.",
      "Treat invented functions, fake threads, and missing documentation as warning signs.",
      "Choose the move that prevents false technical details from entering your code or write-up."
    ]
  },
  "Code Verification": {
    title: "Check the output, not the model's confidence",
    items: [
      "Use known test cases and edge cases to challenge the code's claim.",
      "Watch for off-by-one errors, wrong conditions, and hidden assumptions.",
      "Pick the move that would reveal a bug fastest instead of trusting style or formatting."
    ]
  },
  "Prompt Surgery": {
    title: "Ask AI to coach you, not replace you",
    items: [
      "Prefer prompts that ask for hints, explanations, or test ideas instead of final code.",
      "Avoid prompts that request ready-to-submit solutions, full labs, or copied homework answers.",
      "Pick the prompt that keeps the debugging, writing, and decision-making in the student's hands."
    ]
  },
  "Evidence Match": {
    title: "Match the claim to the best verification source",
    items: [
      "Pick the source or tool that would verify the claim fastest and most reliably.",
      "Use docs for API facts, dev tools for browser behavior, and tests for code behavior.",
      "If the claim is too sketchy to trust at all, choose don't trust it yet."
    ]
  }
};

const reflectionPrompts = {
  correct: {
    title: "What helped you on this round?",
    copy: "Choose the move that helped."
  },
  incorrect: {
    title: "What will you try next time?",
    copy: "Choose one adjustment for the next round."
  },
  timeout: {
    title: "What would help next time?",
    copy: "Choose one move that would help you decide faster."
  }
};

const reflectionFocusByCategory = {
  "CS Hallucinations": [
    {
      id: "hallucination-docs-tools",
      success: "Used docs and tools first",
      next: "Check docs and tools first",
      timeout: "Go to docs and tools first",
      summary: "You kept returning to docs and tools as your first reality check."
    },
    {
      id: "hallucination-source-check",
      success: "Checked the source",
      next: "Question missing sources sooner",
      timeout: "Scan for missing sources sooner",
      summary: "You practiced checking whether a cited method or source was real."
    },
    {
      id: "hallucination-slow-down",
      success: "Paused on confident wording",
      next: "Pause on confident wording",
      timeout: "Slow down on polished claims",
      summary: "You reflected on slowing down when confident claims lacked evidence."
    }
  ],
  "Code Verification": [
    {
      id: "code-known-tests",
      success: "Tried a known-answer test",
      next: "Test with a known answer",
      timeout: "Jump to a quick test case",
      summary: "You kept using quick known-answer tests as your first verification move."
    },
    {
      id: "code-edge-cases",
      success: "Looked for edge cases",
      next: "Look for edge cases first",
      timeout: "Scan boundary cases first",
      summary: "You often reflected on edge cases and boundary conditions."
    },
    {
      id: "code-behavior-over-style",
      success: "Checked behavior, not style",
      next: "Focus on behavior, not style",
      timeout: "Ask what would prove the claim",
      summary: "You practiced checking code behavior instead of relying on surface polish."
    }
  ],
  "Prompt Surgery": [
    {
      id: "prompt-student-thinking",
      success: "Kept student thinking central",
      next: "Keep student thinking central",
      timeout: "Check who is doing the thinking",
      summary: "You kept returning to whether the student's own thinking stayed central."
    },
    {
      id: "prompt-hints-not-answers",
      success: "Chose hints over answers",
      next: "Prefer hints over answers",
      timeout: "Scan for hint-style support",
      summary: "You practiced distinguishing hint-style support from final-answer requests."
    },
    {
      id: "prompt-coach-not-replace",
      success: "Used AI as a coach",
      next: "Ask if AI is replacing the work",
      timeout: "Look for where AI takes over",
      summary: "You reflected on the difference between AI as coach and AI as substitute."
    }
  ],
  "Evidence Match": [
    {
      id: "evidence-match-tool",
      success: "Matched the right verifier",
      next: "Match the right verifier",
      timeout: "Ask which verifier fits first",
      summary: "You kept matching each claim to the best verifier instead of guessing."
    },
    {
      id: "evidence-separate-policy",
      success: "Separated tech from policy",
      next: "Separate tech from policy",
      timeout: "Decide whether it is rules or code",
      summary: "You practiced separating technical questions from policy questions."
    },
    {
      id: "evidence-pause-on-weakness",
      success: "Paused on weak evidence",
      next: "Pause on weak evidence",
      timeout: "Pause sooner when evidence feels thin",
      summary: "You reflected on pausing when the evidence behind a claim felt weak."
    }
  ]
};

const questions = [
  {
    id: "hallucination-python-docs",
    category: "CS Hallucinations",
    typeLabel: "Hallucination Check",
    type: "short-answer",
    title: "The Python method may be invented",
    prompt: "What is the strongest sign that the chatbot may be hallucinating about this Python feature?",
    scenarioLabel: "Model response",
    scenario:
      "A chatbot says Python lists have a built-in method called sort_copy() and claims it was added recently, but you cannot find it in the official Python documentation.",
    expectedAnswer: "the method does not appear in the official docs",
    explanation:
      "Confidence is not proof. If an API or method name is missing from the official docs, that is a strong hallucination warning sign.",
    takeaway:
      "In CS, docs and tooling are better evidence than polished wording.",
    timeLimit: 20,
    difficulty: 0.24
  },
  {
    id: "prompt-debug-hints",
    category: "Prompt Surgery",
    typeLabel: "Prompt Surgery",
    title: "Repair the debugging prompt",
    prompt: "Which rewritten prompt is the best fit for responsible AI use in a CS class?",
    scenarioLabel: "Student goal",
    scenario:
      "Your loop skips the last item in a list. You want help understanding the bug without asking AI to finish the assignment for you.",
    choices: [
      { id: "a", text: "Rewrite my whole program so it works and add comments everywhere." },
      { id: "b", text: "Explain two likely reasons this loop skips the last item and give me hints to test each one." },
      { id: "c", text: "Give me the exact final code I should submit." },
      { id: "d", text: "Finish the assignment and tell me what to say if the teacher asks." }
    ],
    correct: "b",
    explanation:
      "This prompt asks for coaching rather than a finished deliverable. The student still has to test ideas and fix the code themselves.",
    takeaway:
      "The safest CS prompts ask for hints, tests, or explanations instead of final solutions.",
    timeLimit: 18,
    difficulty: 0.2
  },
  {
    id: "code-even-counter",
    category: "Code Verification",
    typeLabel: "Code Check",
    type: "short-answer",
    title: "Verify the claim, not the confidence",
    prompt: "What verification move would best expose a bug in this function?",
    codeLabel: "LLM-generated Python",
    codeQuestionTitle: "The model claims this function counts even numbers in a list.",
    codeClaim:
      "You should not accept that claim just because the code looks clean. Describe the verification move that would most quickly expose a bug if one exists.",
    code: `def count_even(nums):
    total = 0
    for num in nums:
        if num % 2 == 1:
            total += 1
    return total`,
    expectedAnswer: "run tests with known answers",
    explanation:
      "Verification means testing the claim against known cases. An all-even list would immediately show that the code is counting odd numbers instead.",
    takeaway:
      "The fastest way to check code is to run targeted test cases with known outputs.",
    timeLimit: 24,
    difficulty: 0.34
  },
  {
    id: "evidence-official-docs",
    category: "Evidence Match",
    typeLabel: "Evidence Match",
    type: "short-answer",
    title: "Match the claim to the best verification source",
    prompt: "A chatbot says JavaScript arrays have a built-in method named removeAt(). What is the best way to verify that claim?",
    scenarioLabel: "Claim",
    scenario:
      "You want to confirm whether removeAt() is a real JavaScript array method before you use it in your code.",
    expectedAnswer: "official docs",
    explanation:
      "API and method-name claims are best checked in official documentation such as MDN or other primary docs.",
    takeaway:
      "Use official docs when the question is whether a language or API feature actually exists.",
    timeLimit: 18,
    difficulty: 0.24
  },
  {
    id: "hallucination-stackoverflow",
    category: "CS Hallucinations",
    typeLabel: "Hallucination Check",
    title: "The Stack Overflow thread may not exist",
    prompt: "What is the safest next move before you rely on this debugging advice?",
    scenarioLabel: "Model response",
    scenario:
      "A chatbot says a Stack Overflow thread solved the same Java bug, but the link it gives goes nowhere and a search does not show the post.",
    choices: [
      { id: "a", text: "Use the advice anyway because the explanation sounds technical." },
      { id: "b", text: "Verify the idea using trusted docs, your code, and your own tests before using it." },
      { id: "c", text: "Ask the chatbot to rewrite the same answer in fewer words." },
      { id: "d", text: "Cite the chatbot instead of checking the source." }
    ],
    correct: "b",
    explanation:
      "If a referenced thread cannot be found, you should not treat it as proof. In CS, verify the idea against trusted references or a real test.",
    takeaway:
      "Broken or missing technical references are a strong hallucination clue.",
    timeLimit: 18,
    difficulty: 0.26
  },
  {
    id: "prompt-full-solution",
    category: "Prompt Surgery",
    typeLabel: "Prompt Surgery",
    type: "short-answer",
    title: "Spot the unsafe rewrite",
    prompt: "Which rewritten prompt most clearly asks AI to do the graded CS work for the student?",
    scenarioLabel: "Class policy",
    scenario:
      "Your class allows hints and explanations, but not ready-to-submit solutions for labs or projects.",
    expectedAnswer: "write my full java sorting lab",
    explanation:
      "That prompt asks AI to generate the final deliverable for a graded task, which replaces the student's work rather than supporting it.",
    takeaway:
      "A prompt crosses the line when it asks for final code the student is supposed to write.",
    timeLimit: 18,
    difficulty: 0.22
  },
  {
    id: "evidence-dev-tools",
    category: "Evidence Match",
    typeLabel: "Evidence Match",
    title: "Match the claim to the best verification source",
    prompt: "A chatbot says your CSS grid layout is collapsing because the browser is ignoring gap on that page. Which source is the best way to verify that claim?",
    scenarioLabel: "Claim",
    scenario:
      "You need to confirm what the browser is actually applying to the page right now.",
    choices: [
      { id: "a", text: "Official docs" },
      { id: "b", text: "Dev tools" },
      { id: "c", text: "Unit test" },
      { id: "d", text: "Teacher policy" },
      { id: "e", text: "Don't trust it yet" }
    ],
    correct: "b",
    explanation:
      "Browser behavior is best verified in the browser itself. Dev tools show computed styles and layout details directly.",
    takeaway:
      "Use dev tools when you need to verify what the browser is actually doing on the page.",
    timeLimit: 18,
    difficulty: 0.24
  },
  {
    id: "code-loop-boundary",
    category: "Code Verification",
    typeLabel: "Code Check",
    title: "Find the line that deserves skepticism",
    prompt: "Which part of the code should you question first?",
    codeLabel: "LLM-generated JavaScript",
    codeQuestionTitle: "The model says this function always returns the class average.",
    codeClaim:
      "Before you trust the claim, identify the line that is most likely to create a wrong result or runtime issue.",
    code: `function average(scores) {
  let total = 0;

  for (let i = 0; i <= scores.length; i++) {
    total += scores[i];
  }

  return total / scores.length;
}`,
    choices: [
      { id: "a", text: "let total = 0;" },
      { id: "b", text: "for (let i = 0; i <= scores.length; i++) {" },
      { id: "c", text: "return total / scores.length;" },
      { id: "d", text: "function average(scores) {" }
    ],
    correct: "b",
    explanation:
      "The loop runs one step too far. When i equals scores.length, the code reads an item that does not exist, so that line deserves immediate scrutiny.",
    takeaway:
      "Boundary conditions are one of the first things to verify in AI-generated code.",
    timeLimit: 24,
    difficulty: 0.38
  },
  {
    id: "evidence-unit-test",
    category: "Evidence Match",
    typeLabel: "Evidence Match",
    title: "Match the claim to the best verification source",
    prompt: "A chatbot claims your function already handles empty lists correctly. Which source is the best way to verify that claim?",
    scenarioLabel: "Claim",
    scenario:
      "You want direct evidence about how the code behaves for a specific edge case.",
    choices: [
      { id: "a", text: "Official docs" },
      { id: "b", text: "Dev tools" },
      { id: "c", text: "Unit test" },
      { id: "d", text: "Teacher policy" },
      { id: "e", text: "Don't trust it yet" }
    ],
    correct: "c",
    explanation:
      "When the claim is about code behavior on a specific input, the strongest check is a targeted test with a known expected result.",
    takeaway:
      "Use a unit test when you need to verify whether code really behaves the way the model says it does.",
    timeLimit: 18,
    difficulty: 0.26
  },
  {
    id: "hallucination-api-method",
    category: "CS Hallucinations",
    typeLabel: "Hallucination Check",
    title: "The JavaScript API method looks real, but isn't",
    prompt: "What should make you most skeptical here?",
    scenarioLabel: "Model response",
    scenario:
      "A chatbot says the Fetch API includes a built-in method called response.toJSONSync(), but your editor and MDN do not show it.",
    choices: [
      { id: "a", text: "The method is missing from trusted docs and tools." },
      { id: "b", text: "The method name sounds technical and specific." },
      { id: "c", text: "The chatbot included sample code using async." },
      { id: "d", text: "The answer mentioned JSON parsing." }
    ],
    correct: "a",
    explanation:
      "A technical answer can still invent methods. If the docs and your editor do not recognize the API, that is the strongest reason to doubt it.",
    takeaway:
      "In CS, fake method names often hide inside answers that otherwise look believable.",
    timeLimit: 18,
    difficulty: 0.24
  },
  {
    id: "code-negative-values",
    category: "Code Verification",
    typeLabel: "Code Check",
    title: "Test the edge case",
    prompt: "Which test case is best for checking the model's claim that this works for every list of scores?",
    codeLabel: "LLM-generated Python",
    codeQuestionTitle: "The model says this function always finds the highest score.",
    codeClaim:
      "To verify a big claim like 'works for every list,' pick the test case most likely to reveal a hidden assumption.",
    code: `def highest_score(scores):
    highest = 0
    for score in scores:
        if score > highest:
            highest = score
    return highest`,
    choices: [
      { id: "a", text: "[-4, -9, -1]" },
      { id: "b", text: "[12, 18, 7]" },
      { id: "c", text: "[0, 1, 2]" },
      { id: "d", text: "[5]" }
    ],
    correct: "a",
    explanation:
      "All-negative values reveal the hidden assumption that 0 is always a safe starting value. That test is the quickest way to challenge the claim.",
    takeaway:
      "Edge cases matter because AI often writes code that only works for typical inputs.",
    timeLimit: 24,
    difficulty: 0.4
  },
  {
    id: "prompt-edge-case-feedback",
    category: "Prompt Surgery",
    typeLabel: "Prompt Surgery",
    title: "Choose the better rewrite",
    prompt: "Which rewritten prompt stays inside normal CS-class AI guardrails?",
    scenarioLabel: "Student situation",
    scenario:
      "You already wrote your own function and want feedback before submitting your assignment.",
    choices: [
      { id: "a", text: "Fix all my code and rewrite it in a cleaner style so I can submit it." },
      { id: "b", text: "Look at my function and point out one edge case I forgot to test." },
      { id: "c", text: "Complete my TODO sections and optimize everything." },
      { id: "d", text: "Write the comments, reflection, and final explanation for me." }
    ],
    correct: "b",
    explanation:
      "That prompt asks for feedback on the student's own work instead of asking AI to produce the final submission.",
    takeaway:
      "In CS class, feedback prompts are safer than prompts that ask AI to complete missing work.",
    timeLimit: 18,
    difficulty: 0.2
  },
  {
    id: "evidence-teacher-policy",
    category: "Evidence Match",
    typeLabel: "Evidence Match",
    title: "Match the claim to the best verification source",
    prompt: "A student wants to paste their full project instructions into AI and ask for a finished solution. Which source is the best way to verify whether that use is allowed?",
    scenarioLabel: "Claim",
    scenario:
      "The question is not whether the code works, but whether the classroom allows that kind of AI use.",
    choices: [
      { id: "a", text: "Official docs" },
      { id: "b", text: "Dev tools" },
      { id: "c", text: "Unit test" },
      { id: "d", text: "Teacher policy" },
      { id: "e", text: "Don't trust it yet" }
    ],
    correct: "d",
    explanation:
      "This is a classroom-rules question, so the best verification source is the teacher's stated AI policy or assignment rules.",
    takeaway:
      "Use teacher policy when the claim is about what is allowed, not what is technically possible.",
    timeLimit: 18,
    difficulty: 0.2
  },
  {
    id: "hallucination-css-property",
    category: "CS Hallucinations",
    typeLabel: "Hallucination Check",
    title: "The CSS property may be fake",
    prompt: "What is the best verification move here?",
    scenarioLabel: "Model response",
    scenario:
      "A chatbot tells you to use a CSS property called layout-flow: stack; to fix a webpage, but the browser dev tools do not recognize it.",
    choices: [
      { id: "a", text: "Trust it because it sounds like a real CSS feature." },
      { id: "b", text: "Check MDN or other official docs before using it." },
      { id: "c", text: "Rename the property slightly and hope the browser accepts it." },
      { id: "d", text: "Cite the chatbot as the source of the fix." }
    ],
    correct: "b",
    explanation:
      "When the browser and official docs do not support a property, you should assume the model may have invented it until verified.",
    takeaway:
      "For web development questions, browser tools and official docs are your best fact-checkers.",
    timeLimit: 18,
    difficulty: 0.22
  },
  {
    id: "evidence-dont-trust-yet",
    category: "Evidence Match",
    typeLabel: "Evidence Match",
    title: "Match the claim to the best verification source",
    prompt: "A chatbot says there is a package called react-ultrafast-compiler with no docs, no repo, and no package page you can find. Which source is the best match right now?",
    scenarioLabel: "Claim",
    scenario:
      "The claim already looks shaky, and you cannot find any trustworthy sign that the package exists.",
    choices: [
      { id: "a", text: "Official docs" },
      { id: "b", text: "Dev tools" },
      { id: "c", text: "Unit test" },
      { id: "d", text: "Teacher policy" },
      { id: "e", text: "Don't trust it yet" }
    ],
    correct: "e",
    explanation:
      "Some technical claims are so weakly supported that the safest move is to stop trusting them before trying to build on top of them.",
    takeaway:
      "If a technical claim has no trustworthy evidence behind it, don't trust it yet.",
    timeLimit: 18,
    difficulty: 0.28
  }
];

const state = {
  started: false,
  currentQuestionIndex: -1,
  selectedAnswerId: null,
  answered: false,
  players: [],
  responses: [],
  currentReflectionId: null,
  timerId: null,
  timerTotalMs: 20000,
  timeRemainingMs: 20000
};

const frameworkGrid = document.getElementById("framework-grid");
const sidebarFrameworkGrid = document.getElementById("sidebar-framework-grid");
const matchTitle = document.getElementById("match-title");
const introStartButton = document.getElementById("intro-start-button");
const lobbyLeaderboard = document.getElementById("lobby-leaderboard");
const timerText = document.getElementById("timer-text");
const timerFill = document.getElementById("timer-fill");
const questionCount = document.getElementById("question-count");
const rankText = document.getElementById("rank-text");
const streakText = document.getElementById("streak-text");
const statusText = document.getElementById("status-text");
const leaderboard = document.getElementById("leaderboard");
const introView = document.getElementById("intro-view");
const questionView = document.getElementById("question-view");
const resultsView = document.getElementById("results-view");
const questionLabel = document.getElementById("question-label");
const questionCopy = document.getElementById("question-copy");
const hintPanel = document.getElementById("hint-panel");
const hintTitle = document.getElementById("hint-title");
const hintList = document.getElementById("hint-list");
const scenarioLabel = document.getElementById("scenario-label");
const scenarioText = document.getElementById("scenario-text");
const scenarioCard = document.getElementById("scenario-card");
const codeLayout = document.getElementById("code-layout");
const codeLabel = document.getElementById("code-label");
const codeView = document.getElementById("code-view");
const codeQuestionTitle = document.getElementById("code-question-title");
const codeClaim = document.getElementById("code-claim");
const answerForm = document.getElementById("answer-form");
const answerGrid = document.getElementById("answer-grid");
const submitButton = document.getElementById("submit-button");
const nextButton = document.getElementById("next-button");
const postRoundPanels = document.getElementById("post-round-panels");
const feedbackCard = document.getElementById("feedback-card");
const feedbackTitle = document.getElementById("feedback-title");
const pointsChip = document.getElementById("points-chip");
const feedbackBody = document.getElementById("feedback-body");
const reflectionCard = document.getElementById("reflection-card");
const reflectionTitle = document.getElementById("reflection-title");
const reflectionCopy = document.getElementById("reflection-copy");
const reflectionOptions = document.getElementById("reflection-options");
const reflectionStatus = document.getElementById("reflection-status");
const resultsCard = document.getElementById("results-card");
const resultsRank = document.getElementById("results-rank");
const resultsSummary = document.getElementById("results-summary");
const resultsBreakdown = document.getElementById("results-breakdown");
const resultsTakeaways = document.getElementById("results-takeaways");
const resultsReflections = document.getElementById("results-reflections");
const restartButton = document.getElementById("restart-button");

function showView(viewName) {
  const views = {
    intro: introView,
    question: questionView,
    results: resultsView
  };

  Object.entries(views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });
}

function navigateTo(route) {
  const hash = `#${route}`;

  if (window.location.hash !== hash) {
    window.history.pushState(null, "", hash);
  }

  if (route === "intro") {
    showView("intro");
  } else if (route === "results") {
    showView("results");
  } else {
    showView("question");
  }
}

function renderFramework(target) {
  target.innerHTML = "";

  frameworkLanes.forEach((lane) => {
    const card = document.createElement("article");
    card.className = `framework-card ${lane.tone}`;
    card.innerHTML = `
      <p class="section-kicker">${lane.label}</p>
      <h3>${lane.title}</h3>
      <p>${lane.description}</p>
    `;
    target.appendChild(card);
  });
}

function clonePlayers() {
  return playersTemplate.map((player) => ({
    ...player,
    score: 0,
    streak: 0
  }));
}

function getCurrentQuestion() {
  return questions[state.currentQuestionIndex];
}

function sortPlayers() {
  return [...state.players].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return right.streak - left.streak;
  });
}

function getPlayer(id) {
  return state.players.find((player) => player.id === id);
}

function getRankOfCurrentPlayer() {
  const sorted = sortPlayers();
  const index = sorted.findIndex((player) => player.id === "you");
  return index + 1;
}

function updateStatus(message) {
  statusText.textContent = message;
  rankText.textContent = `#${getRankOfCurrentPlayer()}`;
  streakText.textContent = `Streak: ${getPlayer("you").streak}`;
}

function renderPlayerList(target, options = {}) {
  const { lobbyMode = false } = options;

  target.innerHTML = "";
  const sorted = sortPlayers();

  sorted.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = lobbyMode ? "leaderboard-row lobby-row" : "leaderboard-row";

    if (player.id === "you") {
      row.classList.add("current-player");
    }

    row.innerHTML = lobbyMode
      ? `
        <div class="leaderboard-rank">#${index + 1}</div>
        <div>
          <div class="player-name">${player.name}</div>
          <div class="player-note">${player.note}</div>
        </div>
        <div class="player-score">${player.score} pts</div>
      `
      : `
        <div class="leaderboard-rank">#${index + 1}</div>
        <div>
          <div class="player-name">${player.name}</div>
          <div class="player-note">${player.note}</div>
        </div>
        <div class="player-score">${player.score} pts</div>
        <div class="player-streak">${player.streak} streak</div>
      `;

    target.appendChild(row);
  });
}

function renderLeaderboard() {
  renderPlayerList(leaderboard);
  renderPlayerList(lobbyLeaderboard, { lobbyMode: true });
}

function buildChoiceButton(choice, index) {
  const button = document.createElement("button");
  const toneClass = ["tone-a", "tone-b", "tone-c", "tone-d", "tone-e"][index] || "tone-a";

  button.type = "button";
  button.className = `answer-choice ${toneClass}`;
  button.dataset.choiceId = choice.id;
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = `
    <span class="choice-letter">${String.fromCharCode(65 + index)}</span>
    <span class="choice-title">${choice.text}</span>
  `;

  button.addEventListener("click", () => {
    if (state.answered) {
      return;
    }

    state.selectedAnswerId = choice.id;
    renderChoices();
  });

  return button;
}

function renderChoices() {
  answerGrid.innerHTML = "";
  const question = getCurrentQuestion();

  if (question.type === "short-answer") {
    const input = document.createElement("textarea");
    input.id = "short-answer-input";
    input.className = "short-answer-textarea";
    input.placeholder = "Type your answer here...";
    input.value = state.selectedAnswerId || "";
    input.disabled = state.answered;

    input.addEventListener("input", () => {
      state.selectedAnswerId = input.value.trim();
      submitButton.disabled = state.selectedAnswerId === "" || state.answered;
    });

    answerGrid.appendChild(input);
    submitButton.disabled = (state.selectedAnswerId || "").trim() === "" || state.answered;
  } else {
    question.choices.forEach((choice, index) => {
      const button = buildChoiceButton(choice, index);
      const isSelected = choice.id === state.selectedAnswerId;

      if (isSelected) {
        button.classList.add("selected");
        button.setAttribute("aria-pressed", "true");
      }

      if (state.answered) {
        button.disabled = true;

        if (choice.id === question.correct) {
          button.classList.add("correct");
        } else {
          button.classList.add("incorrect");
        }
      }

      answerGrid.appendChild(button);
    });

    submitButton.disabled = state.selectedAnswerId === null || state.answered;
  }
}

function clearTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function updateTimerVisual() {
  const ratio = Math.max(0, state.timeRemainingMs / state.timerTotalMs);
  timerFill.style.width = `${ratio * 100}%`;
  timerText.textContent = `${Math.ceil(state.timeRemainingMs / 1000)}s`;
  timerFill.classList.toggle("warning", ratio <= 0.3);
}

function startTimer(seconds) {
  clearTimer();
  state.timerTotalMs = seconds * 1000;
  state.timeRemainingMs = state.timerTotalMs;
  updateTimerVisual();

  state.timerId = window.setInterval(() => {
    state.timeRemainingMs -= 100;
    updateTimerVisual();

    if (state.timeRemainingMs <= 0) {
      state.timeRemainingMs = 0;
      updateTimerVisual();
      finalizeAnswer(null, true);
    }
  }, 100);
}

function simulateOpponents(question) {
  state.players.forEach((player) => {
    if (player.id === "you") {
      return;
    }

    const chance = Math.min(0.92, Math.max(0.18, player.skill - question.difficulty * 0.35 + 0.08));
    const correct = Math.random() < chance;

    if (correct) {
      const earned = Math.round(520 + Math.random() * 420);
      player.score += earned;
      player.streak += 1;
    } else {
      player.streak = 0;
    }
  });
}

function calculateEarnedPoints(question, isCorrect) {
  if (!isCorrect) {
    return 0;
  }

  return Math.max(420, Math.round(700 + state.timeRemainingMs / 28 - question.difficulty * 140));
}

function getReflectionText(focus, outcomeKey) {
  if (outcomeKey === "correct") {
    return focus.success;
  }

  if (outcomeKey === "timeout") {
    return focus.timeout;
  }

  return focus.next;
}

function renderReflection(question, outcomeKey) {
  const prompt = reflectionPrompts[outcomeKey] || reflectionPrompts.incorrect;
  const focuses = reflectionFocusByCategory[question.category] || [];
  const response = state.responses[state.responses.length - 1];

  reflectionTitle.textContent = prompt.title;
  reflectionCopy.textContent = prompt.copy;
  reflectionOptions.innerHTML = "";

  focuses.forEach((focus) => {
    const reflectionText = getReflectionText(focus, outcomeKey);
    const button = document.createElement("button");

    button.type = "button";
    button.className = "reflection-choice";
    button.textContent = reflectionText;

    if (response?.reflectionId === focus.id) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      const activeResponse = state.responses[state.responses.length - 1];

      if (!activeResponse) {
        return;
      }

      state.currentReflectionId = focus.id;
      activeResponse.reflectionId = focus.id;
      activeResponse.reflectionLabel = reflectionText;
      activeResponse.reflectionSummary = focus.summary;

      reflectionStatus.textContent = `Saved: ${reflectionText}`;
      reflectionStatus.classList.remove("hidden");
      nextButton.disabled = false;
      updateStatus("Reflection saved. Continue to the next round when you're ready.");
      renderReflection(question, outcomeKey);
    });

    reflectionOptions.appendChild(button);
  });

  reflectionCard.classList.remove("hidden");

  if (response?.reflectionId) {
    reflectionStatus.textContent = `Saved: ${response.reflectionLabel}`;
    reflectionStatus.classList.remove("hidden");
    nextButton.disabled = false;
  } else {
    reflectionStatus.textContent = "";
    reflectionStatus.classList.add("hidden");
    nextButton.disabled = focuses.length > 0;
  }
}

function renderQuestion() {
  const question = getCurrentQuestion();
  const scaffolding = scaffoldingByCategory[question.category];
  const player = getPlayer("you");
  const hintHidden = player.streak >= 2;

  matchTitle.textContent = `Round ${state.currentQuestionIndex + 1} of ${questions.length}`;
  questionCount.textContent = `Question ${state.currentQuestionIndex + 1} / ${questions.length}`;
  questionLabel.textContent = `Question ${state.currentQuestionIndex + 1}`;
  questionCopy.textContent = question.prompt;
  hintTitle.textContent = scaffolding.title;
  hintList.innerHTML = "";
  scaffolding.items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    hintList.appendChild(listItem);
  });
  hintPanel.classList.toggle("hidden", hintHidden);
  hintPanel.open = false;
  scenarioLabel.textContent = question.scenarioLabel || "Scenario";
  scenarioText.textContent = question.scenario || "";

  if (question.code) {
    scenarioCard.classList.add("hidden");
    codeLayout.classList.remove("hidden");
    codeLabel.textContent = question.codeLabel;
    codeView.textContent = question.code;
    codeQuestionTitle.textContent = question.codeQuestionTitle;
    codeClaim.textContent = question.codeClaim;
  } else {
    scenarioCard.classList.remove("hidden");
    codeLayout.classList.add("hidden");
    codeView.textContent = "";
    codeQuestionTitle.textContent = "";
    codeClaim.textContent = "";
  }

  state.selectedAnswerId = null;
  state.answered = false;
  state.currentReflectionId = null;
  renderChoices();

  postRoundPanels.classList.add("hidden");
  feedbackCard.classList.add("hidden");
  reflectionCard.classList.add("hidden");
  reflectionOptions.innerHTML = "";
  reflectionStatus.textContent = "";
  reflectionStatus.classList.add("hidden");
  nextButton.classList.add("hidden");
  resultsCard.classList.add("hidden");
  submitButton.textContent = "Lock in answer";

  updateStatus("Answer quickly and accurately to climb the leaderboard.");
  navigateTo(`question-${state.currentQuestionIndex + 1}`);
  startTimer(Math.round(question.timeLimit * ROUND_TIME_MULTIPLIER));
}

function finalizeAnswer(selectedAnswerId, timedOut = false) {
  if (state.answered) {
    return;
  }

  clearTimer();
  state.answered = true;

  const question = getCurrentQuestion();
  const player = getPlayer("you");

  let isCorrect;
  if (question.type === "short-answer") {
    const userAnswer = (selectedAnswerId || "").toLowerCase().trim();
    const expectedAnswer = question.expectedAnswer.toLowerCase().trim();
    isCorrect = userAnswer.includes(expectedAnswer) || expectedAnswer.includes(userAnswer);
  } else {
    isCorrect = selectedAnswerId === question.correct;
  }

  const earnedPoints = calculateEarnedPoints(question, isCorrect);

  if (isCorrect) {
    player.score += earnedPoints;
    player.streak += 1;
  } else {
    player.streak = 0;
  }

  hintPanel.classList.toggle("hidden", player.streak >= 2);

  simulateOpponents(question);
  renderChoices();
  renderLeaderboard();

  state.responses.push({
    id: question.id,
    category: question.category,
    correct: isCorrect,
    reflectionId: null,
    reflectionLabel: "",
    reflectionSummary: ""
  });

  if (timedOut) {
    feedbackTitle.textContent = "Time's up";
    pointsChip.textContent = "0 pts";
    updateStatus("The timer hit zero. Read the explanation and jump to the next round.");
  } else if (isCorrect) {
    feedbackTitle.textContent = "Correct answer";
    pointsChip.textContent = `+${earnedPoints} pts`;
    updateStatus(`Nice work. You picked up ${earnedPoints} points and kept your streak alive.`);
  } else {
    feedbackTitle.textContent = "Not this round";
    pointsChip.textContent = "0 pts";
    updateStatus("You missed this one. Use the explanation to sharpen the next decision.");
  }

  let feedbackText;
  if (question.type === "short-answer") {
    feedbackText = `Expected answer: ${question.expectedAnswer}. ${question.explanation} ${question.takeaway}`;
  } else {
    const correctChoice = question.choices.find((choice) => choice.id === question.correct);
    feedbackText = `Correct: ${correctChoice.text}. ${question.explanation} ${question.takeaway}`;
  }
  feedbackBody.textContent = feedbackText;
  postRoundPanels.classList.remove("hidden");
  feedbackCard.classList.remove("hidden");

  const outcomeKey = timedOut ? "timeout" : isCorrect ? "correct" : "incorrect";
  nextButton.textContent =
    state.currentQuestionIndex === questions.length - 1 ? "See final leaderboard" : "Next question";
  nextButton.classList.remove("hidden");
  nextButton.disabled = true;
  submitButton.disabled = true;
  renderReflection(question, outcomeKey);
}

function buildBreakdown() {
  const categories = ["CS Hallucinations", "Code Verification", "Prompt Surgery", "Evidence Match"];

  return categories.map((category) => {
    const total = state.responses.filter((response) => response.category === category).length;
    const correct = state.responses.filter(
      (response) => response.category === category && response.correct
    ).length;

    return `${category}: ${correct}/${total} correct`;
  });
}

function buildTakeaways() {
  const hallucinationCorrect = state.responses.filter(
    (response) => response.category === "CS Hallucinations" && response.correct
  ).length;
  const codeCorrect = state.responses.filter(
    (response) => response.category === "Code Verification" && response.correct
  ).length;
  const promptCorrect = state.responses.filter(
    (response) => response.category === "Prompt Surgery" && response.correct
  ).length;
  const evidenceCorrect = state.responses.filter(
    (response) => response.category === "Evidence Match" && response.correct
  ).length;

  const takeaways = [];

  if (hallucinationCorrect < 2) {
    takeaways.push(
      "CS hallucinations are easiest to catch when you verify APIs, method names, and syntax in official docs or trusted tools."
    );
  }

  if (codeCorrect < 2) {
    takeaways.push(
      "AI-generated code needs test cases, edge cases, and boundary checks before you trust the output."
    );
  }

  if (promptCorrect < 2) {
    takeaways.push(
      "The best coding prompts ask AI for hints, explanations, or tests instead of ready-to-submit code."
    );
  }

  if (evidenceCorrect < 2) {
    takeaways.push(
      "Evidence-match rounds get easier when you pair the claim with the right verifier: docs for APIs, dev tools for browser behavior, tests for code behavior, policy for classroom rules."
    );
  }

  if (takeaways.length === 0) {
    takeaways.push(
      "You handled the three big moves well: verify technical claims, test code behavior, and use AI as a coach instead of a substitute."
    );
  }

  return takeaways;
}

function buildReflectionSummary() {
  const completedReflections = state.responses.filter((response) => response.reflectionId).length;
  const focusCounts = new Map();

  state.responses.forEach((response) => {
    if (!response.reflectionSummary) {
      return;
    }

    focusCounts.set(
      response.reflectionSummary,
      (focusCounts.get(response.reflectionSummary) || 0) + 1
    );
  });

  const summaryItems = [
    `You completed ${completedReflections} quick reflections, building a habit of pausing after each round before moving on.`
  ];

  [...focusCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .forEach(([summary, count]) => {
      summaryItems.push(`${summary} (${count} round${count === 1 ? "" : "s"}).`);
    });

  summaryItems.push(
    "Carry that habit forward: when a future AI answer feels easy to trust, ask yourself what evidence or rule you would check first."
  );

  return summaryItems;
}

function showResults() {
  clearTimer();
  const yourRank = getRankOfCurrentPlayer();
  const yourPlayer = getPlayer("you");
  const correctCount = state.responses.filter((response) => response.correct).length;

  resultsRank.textContent = `#${yourRank}`;
  resultsSummary.textContent =
    `You answered ${correctCount} of ${questions.length} questions correctly and finished with ${yourPlayer.score} points.`;

  resultsBreakdown.innerHTML = "";
  buildBreakdown().forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    resultsBreakdown.appendChild(listItem);
  });

  resultsTakeaways.innerHTML = "";
  buildTakeaways().forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    resultsTakeaways.appendChild(listItem);
  });

  resultsReflections.innerHTML = "";
  buildReflectionSummary().forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    resultsReflections.appendChild(listItem);
  });

  resultsCard.classList.remove("hidden");
  nextButton.classList.add("hidden");
  submitButton.disabled = true;
  submitButton.textContent = "Match complete";
  updateStatus(`Match complete. You finished #${yourRank} with ${yourPlayer.score} points.`);
  navigateTo("results");
}

function startMatch() {
  state.started = true;
  state.currentQuestionIndex = 0;
  state.players = clonePlayers();
  state.responses = [];
  state.currentReflectionId = null;

  renderLeaderboard();
  renderQuestion();
}

function goToNextQuestion() {
  const latestResponse = state.responses[state.responses.length - 1];

  if (state.answered && latestResponse && !latestResponse.reflectionId) {
    updateStatus("Choose one quick reflection before moving to the next round.");
    return;
  }

  if (state.currentQuestionIndex === questions.length - 1) {
    showResults();
    return;
  }

  state.currentQuestionIndex += 1;
  renderQuestion();
}

function initializeView() {
  renderFramework(frameworkGrid);
  renderFramework(sidebarFrameworkGrid);
  state.players = clonePlayers();
  renderLeaderboard();
  showView("intro");
  updateStatus("Press start to jump into the first question.");
  questionCount.textContent = `Question 0 / ${questions.length}`;
  timerFill.style.width = "100%";
  window.history.replaceState(null, "", "#intro");
}

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!state.started || state.selectedAnswerId === null || state.answered) {
    return;
  }

  finalizeAnswer(state.selectedAnswerId);
});

nextButton.addEventListener("click", () => {
  goToNextQuestion();
});

restartButton.addEventListener("click", () => {
  clearTimer();
  startMatch();
});

introStartButton.addEventListener("click", () => {
  clearTimer();
  startMatch();
});

initializeView();

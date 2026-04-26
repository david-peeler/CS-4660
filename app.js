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

const CASE_TIME_MULTIPLIER = 3;

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
    title: "Lock in the lesson",
    copy: "Pick the lesson you want to carry forward. Choosing one will move you to the next case."
  },
  incorrect: {
    title: "Reset the lesson",
    copy: "Use the explanation to choose the lesson you want to use next time. Choosing one will move you on."
  },
  timeout: {
    title: "Recover the lesson",
    copy: "Choose the lesson that would help you decide faster next time. Choosing one will move you on."
  }
};

const reflectionChoicesByCategory = {
  "CS Hallucinations": [
    {
      id: "hallucination-docs-first",
      label: "If docs and tools cannot confirm it, I should not trust the feature yet."
    },
    {
      id: "hallucination-source-check",
      label: "If the source cannot be verified, I should test or verify the advice before using it."
    },
    {
      id: "hallucination-slow-down",
      label: "If the answer sounds polished, I should slow down and look for evidence."
    }
  ],
  "Code Verification": [
    {
      id: "code-known-tests",
      label: "Run a quick known-answer test before trusting a strong code claim."
    },
    {
      id: "code-edge-cases",
      label: "Use edge cases first when the model says code always works."
    },
    {
      id: "code-behavior-over-style",
      label: "Judge the code by behavior, not by how clean it looks."
    }
  ],
  "Prompt Surgery": [
    {
      id: "prompt-student-thinking",
      label: "Keep the student's own thinking in the loop when using AI."
    },
    {
      id: "prompt-hints-not-answers",
      label: "Ask AI for hints, tests, or feedback instead of finished work."
    },
    {
      id: "prompt-coach-not-replace",
      label: "Stop when AI starts replacing the graded work instead of supporting it."
    }
  ],
  "Evidence Match": [
    {
      id: "evidence-match-docs",
      label: "Match fact claims to docs instead of guessing."
    },
    {
      id: "evidence-match-tools",
      label: "Match behavior claims to live tools or tests."
    },
    {
      id: "evidence-dont-trust-yet",
      label: "If the evidence is thin, do not trust the claim yet."
    }
  ]
};

const questions = [
  {
    id: "hallucination-python-docs",
    category: "CS Hallucinations",
    typeLabel: "Hallucination Check",
    title: "The Python method may be invented",
    prompt: "Tap the exact line in the model output that should trigger a docs check first.",
    interactionType: "line-pick",
    linePickSource: "chatOutput",
    chatPromptLabel: "Prompt",
    chatPrompt:
      "How can I sort a Python list without mutating the original list? Show me the method and a short example.",
    chatOutputLabel: "Model output",
    chatOutput: `# Use the new built-in list method sort_copy().
numbers = [3, 1, 2]
sorted_numbers = numbers.sort_copy()
print(sorted_numbers)`,
    correct: "line-3",
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
    title: "Verify the claim, not the confidence",
    prompt: "Which move best verifies the model's claim before you trust this function?",
    codeLabel: "LLM-generated Python",
    codeQuestionTitle: "The model claims this function counts even numbers in a list.",
    codeClaim:
      "You should not accept that claim just because the code looks clean. Pick the verification move that would most quickly expose a bug if one exists.",
    code: `def count_even(nums):
    total = 0
    for num in nums:
        if num % 2 == 1:
            total += 1
    return total`,
    choices: [
      { id: "a", text: "Rename total to even_total so the code reads more clearly." },
      { id: "b", text: "Run short tests with known answers, including all-even and all-odd lists." },
      { id: "c", text: "Ask the model if it is completely sure the function works." },
      { id: "d", text: "Trust it because the loop and if statement look correct at first glance." }
    ],
    correct: "b",
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
    title: "Match the claim to the best verification source",
    prompt: "A chatbot says JavaScript arrays have a built-in method named removeAt(). Which source is the best way to verify that claim?",
    scenarioLabel: "Claim",
    scenario:
      "You want to confirm whether removeAt() is a real JavaScript array method before you use it in your code.",
    choices: [
      { id: "a", text: "Official docs" },
      { id: "b", text: "Dev tools" },
      { id: "c", text: "Unit test" },
      { id: "d", text: "Teacher policy" },
      { id: "e", text: "Don't trust it yet" }
    ],
    correct: "a",
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
    prompt: "Tap the exact line that should make you verify the source before trusting the advice.",
    interactionType: "line-pick",
    linePickSource: "chatOutput",
    chatPromptLabel: "Prompt",
    chatPrompt:
      "I keep hitting a Java config-loading bug. Has anyone already solved this, and what code should I try first?",
    chatOutputLabel: "Model output",
    chatOutput: `// Based on the Stack Overflow thread "Fixing NullPointerException in ConfigLoader.parseConfig"
Config config = ConfigLoader.loadOrCreate(file);
config.parseConfig();
System.out.println(config.getTimeout());`,
    correct: "line-1",
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
    title: "Spot the unsafe rewrite",
    prompt: "Which rewritten prompt most clearly asks AI to do the graded CS work for the student?",
    scenarioLabel: "Class policy",
    scenario:
      "Your class allows hints and explanations, but not ready-to-submit solutions for labs or projects.",
    choices: [
      { id: "a", text: "Quiz me on recursion with practice questions." },
      { id: "b", text: "Review my pseudocode and tell me one weak spot." },
      { id: "c", text: "Write my full Java sorting lab so I can turn it in tonight." },
      { id: "d", text: "Explain what a base case does in recursion." }
    ],
    correct: "c",
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
    prompt: "Tap the exact line you would inspect first.",
    interactionType: "line-pick",
    linePickSource: "code",
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
    inspectLines: [
      "function average(scores) {",
      "  let total = 0;",
      "  for (let i = 0; i <= scores.length; i++) {",
      "    total += scores[i];",
      "  }",
      "  return total / scores.length;",
      "}"
    ],
    correct: "line-3",
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
    prompt: "Tap the exact line that should make you most skeptical.",
    interactionType: "line-pick",
    linePickSource: "chatOutput",
    chatPromptLabel: "Prompt",
    chatPrompt:
      "How can I turn a fetch response into JSON right away? Show me the cleanest built-in method.",
    chatOutputLabel: "Model output",
    chatOutput: `const response = await fetch("/api/user");
const user = response.toJSONSync();
console.log(user.name);`,
    correct: "line-2",
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
    prompt: "Tap the exact line that deserves a docs check first.",
    interactionType: "line-pick",
    linePickSource: "chatOutput",
    chatPromptLabel: "Prompt",
    chatPrompt:
      "What is the quickest CSS fix to stack these cards vertically? Show me the property I should add.",
    chatOutputLabel: "Model output",
    chatOutput: `.card-list {
  display: flex;
  layout-flow: stack;
}`,
    correct: "line-3",
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
  evidenceScore: 0,
  correctStreak: 0,
  strongestStreak: 0,
  responses: [],
  timerId: null,
  advanceTimerId: null,
  timerTotalMs: 20000,
  timeRemainingMs: 20000
};

const frameworkGrid = document.getElementById("framework-grid");
const sidebarFrameworkGrid = document.getElementById("sidebar-framework-grid");
const caseTitle = document.getElementById("case-title");
const introStartButton = document.getElementById("intro-start-button");
const timerText = document.getElementById("timer-text");
const timerFill = document.getElementById("timer-fill");
const questionCount = document.getElementById("question-count");
const rankText = document.getElementById("rank-text");
const streakText = document.getElementById("streak-text");
const statusText = document.getElementById("status-text");
const introView = document.getElementById("intro-view");
const questionView = document.getElementById("question-view");
const resultsView = document.getElementById("results-view");
const questionPage = document.getElementById("question-page");
const questionLabel = document.getElementById("question-label");
const questionCopy = document.getElementById("question-copy");
const hintPanel = document.getElementById("hint-panel");
const hintTitle = document.getElementById("hint-title");
const hintList = document.getElementById("hint-list");
const scenarioLabel = document.getElementById("scenario-label");
const scenarioText = document.getElementById("scenario-text");
const scenarioCard = document.getElementById("scenario-card");
const hallucinationLayout = document.getElementById("hallucination-layout");
const hallucinationPromptLabel = document.getElementById("hallucination-prompt-label");
const hallucinationPromptText = document.getElementById("hallucination-prompt-text");
const hallucinationOutputLabel = document.getElementById("hallucination-output-label");
const hallucinationOutputView = document.getElementById("hallucination-output-view");
const hallucinationOutputInspector = document.getElementById("hallucination-output-inspector");
const codeLayout = document.getElementById("code-layout");
const codeLabel = document.getElementById("code-label");
const codeView = document.getElementById("code-view");
const codeInspector = document.getElementById("code-inspector");
const codeQuestionTitle = document.getElementById("code-question-title");
const codeClaim = document.getElementById("code-claim");
const answerForm = document.getElementById("answer-form");
const answerGrid = document.getElementById("answer-grid");
const submitButton = document.getElementById("submit-button");
const reflectionOverlay = document.getElementById("reflection-overlay");
const feedbackCard = document.getElementById("feedback-card");
const feedbackTitle = document.getElementById("feedback-title");
const evidenceChip = document.getElementById("evidence-chip");
const feedbackBody = document.getElementById("feedback-body");
const reflectionCard = document.getElementById("reflection-card");
const reflectionTitle = document.getElementById("reflection-title");
const reflectionCopy = document.getElementById("reflection-copy");
const reflectionNote = document.getElementById("reflection-note");
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

function getCurrentQuestion() {
  return questions[state.currentQuestionIndex];
}

function getJudgmentTrackerLabel(streak) {
  if (streak >= 3) {
    return "Locked in";
  }

  if (streak === 2) {
    return "Steady";
  }

  if (streak === 1) {
    return "Building";
  }

  return "Resetting";
}

function resetProgress() {
  state.evidenceScore = 0;
  state.correctStreak = 0;
  state.strongestStreak = 0;
  state.responses = [];
}

function updateStatus(message) {
  statusText.textContent = message;
  rankText.textContent = `Evidence: ${state.evidenceScore}`;
  streakText.textContent = `Judgment tracker: ${getJudgmentTrackerLabel(state.correctStreak)}`;
}

function isLinePickQuestion(question) {
  return question.interactionType === "line-pick";
}

function getInspectableLines(question) {
  if (question.inspectLines?.length) {
    return question.inspectLines;
  }

  if (question.linePickSource === "code" && question.code) {
    return question.code.split("\n");
  }

  if (question.linePickSource === "chatOutput" && question.chatOutput) {
    return question.chatOutput.split("\n");
  }

  return [];
}

function getInspectableTarget(question) {
  if (question.linePickSource === "chatOutput") {
    return {
      staticView: hallucinationOutputView,
      interactiveView: hallucinationOutputInspector
    };
  }

  return {
    staticView: codeView,
    interactiveView: codeInspector
  };
}

function resetInspectableViews() {
  hallucinationOutputView.classList.remove("hidden");
  hallucinationOutputInspector.classList.add("hidden");
  hallucinationOutputInspector.innerHTML = "";
  codeView.classList.remove("hidden");
  codeInspector.classList.add("hidden");
  codeInspector.innerHTML = "";
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

function buildInspectableLineButton(question, lineText, index) {
  const button = document.createElement("button");
  const lineId = `line-${index + 1}`;
  const number = document.createElement("span");
  const text = document.createElement("span");
  const isSelected = state.selectedAnswerId === lineId;

  button.type = "button";
  button.className = "inspect-line";
  button.dataset.choiceId = lineId;
  button.setAttribute("aria-pressed", isSelected ? "true" : "false");

  number.className = "inspect-line-number";
  number.textContent = String(index + 1);
  text.className = "inspect-line-text";
  text.textContent = lineText || " ";

  button.append(number, text);

  if (isSelected) {
    button.classList.add("selected");
  }

  if (state.answered) {
    button.disabled = true;

    if (lineId === question.correct) {
      button.classList.add("correct");
    } else if (isSelected) {
      button.classList.add("incorrect");
    }
  }

  button.addEventListener("click", () => {
    if (state.answered) {
      return;
    }

    state.selectedAnswerId = lineId;
    renderChoices();
  });

  return button;
}

function renderInspectableLines(question) {
  const { staticView, interactiveView } = getInspectableTarget(question);

  staticView.classList.add("hidden");
  interactiveView.classList.remove("hidden");
  interactiveView.innerHTML = "";

  getInspectableLines(question).forEach((lineText, index) => {
    interactiveView.appendChild(buildInspectableLineButton(question, lineText, index));
  });
}

function renderChoices() {
  const question = getCurrentQuestion();

  if (isLinePickQuestion(question)) {
    answerGrid.innerHTML = "";
    answerGrid.classList.add("hidden");
    renderInspectableLines(question);
    submitButton.disabled = state.selectedAnswerId === null || state.answered;
    return;
  }

  answerGrid.classList.remove("hidden");
  answerGrid.innerHTML = "";

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

function clearTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function clearAdvanceTimer() {
  if (state.advanceTimerId) {
    window.clearTimeout(state.advanceTimerId);
    state.advanceTimerId = null;
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

function calculateEvidenceScore(question, isCorrect) {
  if (!isCorrect) {
    return 0;
  }

  return Math.max(420, Math.round(700 + state.timeRemainingMs / 28 - question.difficulty * 140));
}

function showReflectionOverlay() {
  questionPage.classList.add("is-reflecting");
  reflectionOverlay.classList.remove("hidden");
  reflectionOverlay.setAttribute("aria-hidden", "false");
}

function hideReflectionOverlay() {
  questionPage.classList.remove("is-reflecting");
  reflectionOverlay.classList.add("hidden");
  reflectionOverlay.setAttribute("aria-hidden", "true");
  reflectionCard.classList.remove("is-advancing");
}

function queueReflectionAdvance() {
  clearAdvanceTimer();
  state.advanceTimerId = window.setTimeout(() => {
    state.advanceTimerId = null;
    goToNextQuestion();
  }, 220);
}

function renderReflection(question, outcomeKey) {
  const prompt = reflectionPrompts[outcomeKey] || reflectionPrompts.incorrect;
  const choices = reflectionChoicesByCategory[question.category] || [];
  const response = state.responses[state.responses.length - 1];

  reflectionTitle.textContent = prompt.title;
  reflectionCopy.textContent = prompt.copy;
  reflectionNote.value = response?.reflectionNote || "";
  reflectionOptions.innerHTML = "";
  reflectionStatus.textContent = "";
  reflectionStatus.classList.add("hidden");
  reflectionCard.classList.remove("is-advancing");

  choices.forEach((choice) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "reflection-choice";
    button.textContent = choice.label;

    if (response?.reflectionId === choice.id) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      const activeResponse = state.responses[state.responses.length - 1];

      if (!activeResponse || reflectionCard.classList.contains("is-advancing")) {
        return;
      }

      activeResponse.reflectionId = choice.id;
      activeResponse.reflectionLabel = choice.label;
      activeResponse.reflectionNote = reflectionNote.value.trim();

      reflectionOptions.querySelectorAll(".reflection-choice").forEach((optionButton) => {
        optionButton.disabled = true;
        optionButton.classList.toggle("selected", optionButton === button);
      });

      reflectionNote.disabled = true;
      reflectionCard.classList.add("is-advancing");
      reflectionStatus.textContent =
        state.currentQuestionIndex === questions.length - 1
          ? "Saved. Opening your final review..."
          : "Saved. Loading the next case...";
      reflectionStatus.classList.remove("hidden");
      updateStatus(
        state.currentQuestionIndex === questions.length - 1
          ? "Reflection saved. Opening your final review."
          : "Reflection saved. Loading the next case."
      );
      queueReflectionAdvance();
    });

    reflectionOptions.appendChild(button);
  });

  reflectionNote.disabled = false;
  reflectionCard.classList.remove("hidden");
  showReflectionOverlay();
}

function renderQuestion() {
  const question = getCurrentQuestion();
  const scaffolding = scaffoldingByCategory[question.category];
  const hintHidden = state.correctStreak >= 2;
  const hasChatExchange = Boolean(question.chatPrompt && question.chatOutput);
  const linePickQuestion = isLinePickQuestion(question);

  clearAdvanceTimer();
  hideReflectionOverlay();
  resetInspectableViews();
  caseTitle.textContent = `Case ${state.currentQuestionIndex + 1} of ${questions.length}`;
  questionCount.textContent = `Case ${state.currentQuestionIndex + 1} / ${questions.length}`;
  questionLabel.textContent = `Case ${state.currentQuestionIndex + 1}`;
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
  hallucinationLayout.classList.toggle("hidden", !hasChatExchange);

  if (hasChatExchange) {
    scenarioCard.classList.add("hidden");
    codeLayout.classList.add("hidden");
    hallucinationPromptLabel.textContent = question.chatPromptLabel || "Prompt";
    hallucinationPromptText.textContent = question.chatPrompt;
    hallucinationOutputLabel.textContent = question.chatOutputLabel || "Model output";
    hallucinationOutputView.textContent = question.chatOutput;
    codeView.textContent = "";
    codeQuestionTitle.textContent = "";
    codeClaim.textContent = "";
  } else if (question.code) {
    scenarioCard.classList.add("hidden");
    hallucinationLayout.classList.add("hidden");
    hallucinationPromptText.textContent = "";
    hallucinationOutputView.textContent = "";
    codeLayout.classList.remove("hidden");
    codeLabel.textContent = question.codeLabel;
    codeView.textContent = question.code;
    codeQuestionTitle.textContent = question.codeQuestionTitle;
    codeClaim.textContent = question.codeClaim;
  } else {
    scenarioCard.classList.remove("hidden");
    hallucinationLayout.classList.add("hidden");
    codeLayout.classList.add("hidden");
    hallucinationPromptText.textContent = "";
    hallucinationOutputView.textContent = "";
    codeView.textContent = "";
    codeQuestionTitle.textContent = "";
    codeClaim.textContent = "";
  }

  state.selectedAnswerId = null;
  state.answered = false;
  renderChoices();

  feedbackCard.classList.add("hidden");
  reflectionCard.classList.add("hidden");
  reflectionOptions.innerHTML = "";
  reflectionNote.value = "";
  reflectionNote.disabled = false;
  reflectionStatus.textContent = "";
  reflectionStatus.classList.add("hidden");
  resultsCard.classList.add("hidden");
  submitButton.textContent = linePickQuestion ? "Submit highlighted line" : "Submit decision";

  updateStatus(
    linePickQuestion
      ? "Inspect the case directly, highlight the line you would check first, and submit your decision."
      : "Work through the scenario and submit your strongest decision."
  );
  navigateTo(`case-${state.currentQuestionIndex + 1}`);
  startTimer(Math.round(question.timeLimit * CASE_TIME_MULTIPLIER));
}

function getCorrectAnswerText(question) {
  if (isLinePickQuestion(question)) {
    const correctIndex = Number(question.correct.replace("line-", "")) - 1;
    const lineText = getInspectableLines(question)[correctIndex] || "";
    return `Line ${correctIndex + 1}: ${lineText.trim() || "(blank line)"}`;
  }

  const correctChoice = question.choices.find((choice) => choice.id === question.correct);
  return correctChoice ? correctChoice.text : "the strongest move";
}

function finalizeAnswer(selectedAnswerId, timedOut = false) {
  if (state.answered) {
    return;
  }

  clearTimer();
  state.answered = true;

  const question = getCurrentQuestion();
  const isCorrect = selectedAnswerId === question.correct;
  const earnedEvidence = calculateEvidenceScore(question, isCorrect);

  if (isCorrect) {
    state.evidenceScore += earnedEvidence;
    state.correctStreak += 1;
    state.strongestStreak = Math.max(state.strongestStreak, state.correctStreak);
  } else {
    state.correctStreak = 0;
  }

  hintPanel.classList.toggle("hidden", state.correctStreak >= 2);
  renderChoices();

  state.responses.push({
    id: question.id,
    category: question.category,
    correct: isCorrect,
    reflectionId: null,
    reflectionLabel: "",
    reflectionNote: ""
  });

  if (timedOut) {
    feedbackTitle.textContent = "Review window closed";
    evidenceChip.textContent = "Evidence +0";
    updateStatus("The review window closed. Read the explanation and continue.");
  } else if (isCorrect) {
    feedbackTitle.textContent = "Strong decision";
    evidenceChip.textContent = `Evidence +${earnedEvidence}`;
    updateStatus(`Strong call. You added ${earnedEvidence} evidence.`);
  } else {
    feedbackTitle.textContent = "Needs review";
    evidenceChip.textContent = "Evidence +0";
    updateStatus("Review the explanation and adjust your next decision.");
  }

  feedbackBody.textContent =
    `${isLinePickQuestion(question) ? "Best line to inspect first" : "Strongest move"}: ${getCorrectAnswerText(question)}. ${question.explanation} ${question.takeaway}`;
  feedbackCard.classList.remove("hidden");

  const outcomeKey = timedOut ? "timeout" : isCorrect ? "correct" : "incorrect";
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
      "Evidence-matching gets easier when you pair each claim with the right verifier: docs for APIs, dev tools for browser behavior, tests for code behavior, policy for classroom rules."
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
  const reflectionCounts = new Map();
  const noteCount = state.responses.filter((response) => response.reflectionNote).length;

  state.responses.forEach((response) => {
    if (response.reflectionLabel) {
      reflectionCounts.set(
        response.reflectionLabel,
        (reflectionCounts.get(response.reflectionLabel) || 0) + 1
      );
    }
  });

  const summaryItems = [
    `You completed ${completedReflections} case reflections before moving on.`
  ];

  [...reflectionCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 1)
    .forEach(([label, count]) => {
      summaryItems.push(`Lesson you chose most often: ${label} (${count} case${count === 1 ? "" : "s"}).`);
    });

  if (noteCount > 0) {
    summaryItems.push(`You left yourself ${noteCount} short note${noteCount === 1 ? "" : "s"} to carry into later cases.`);
  }

  summaryItems.push(
    "Carry that habit forward: when a future AI answer feels easy to trust, ask yourself what evidence or rule you would check first."
  );

  return summaryItems;
}

function showResults() {
  clearAdvanceTimer();
  clearTimer();
  hideReflectionOverlay();
  const correctCount = state.responses.filter((response) => response.correct).length;

  resultsRank.textContent = `Evidence score: ${state.evidenceScore}`;
  resultsSummary.textContent =
    `You reviewed ${correctCount} of ${questions.length} cases accurately. Your evidence score finished at ${state.evidenceScore}, and your judgment tracker peaked at ${getJudgmentTrackerLabel(state.strongestStreak)}.`;

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
  submitButton.disabled = true;
  submitButton.textContent = "Case review complete";
  updateStatus(`Case review complete. Evidence score ${state.evidenceScore}.`);
  navigateTo("results");
}

function startReview() {
  state.started = true;
  state.currentQuestionIndex = 0;
  resetProgress();
  renderQuestion();
}

function goToNextQuestion() {
  const latestResponse = state.responses[state.responses.length - 1];

  if (state.answered && latestResponse && !latestResponse.reflectionId) {
    updateStatus("Choose a reflection before moving to the next case.");
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
  clearAdvanceTimer();
  hideReflectionOverlay();
  renderFramework(frameworkGrid);
  renderFramework(sidebarFrameworkGrid);
  resetProgress();
  showView("intro");
  updateStatus("Open case 1 to begin.");
  questionCount.textContent = `Case 0 / ${questions.length}`;
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

restartButton.addEventListener("click", () => {
  clearAdvanceTimer();
  clearTimer();
  startReview();
});

introStartButton.addEventListener("click", () => {
  clearAdvanceTimer();
  clearTimer();
  startReview();
});

initializeView();

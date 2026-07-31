/* =========================================================
   CMA MASTER PRO — app logic
   Handles: view navigation, loading questions.json,
   building a practice session, timer, scoring.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- State ---------- */
  const state = {
    bank: { part1: [], part2: [] },
    setup: { part: "both", count: 10, secondsPerQuestion: 60 },
    session: {
      questions: [],
      index: 0,
      answers: [],       // { correct: bool, topic, part }
      timerId: null,
      timeLeft: 0
    }
  };

  /* ---------- Element refs ---------- */
  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindNav();
    bindSetupControls();
    loadQuestions();
    showView("home");
  }

  function cacheElements() {
    els.views = document.querySelectorAll(".view");
    els.navButtons = document.querySelectorAll("[data-nav]");
    els.statQuestions = document.getElementById("stat-questions");

    els.partSelect = document.getElementById("part-select");
    els.countSelect = document.getElementById("count-select");
    els.timerSelect = document.getElementById("timer-select");
    els.startSessionBtn = document.getElementById("start-session-btn");
    els.setupNote = document.getElementById("setup-note");
    els.practiceSetup = document.getElementById("practice-setup");

    els.quizScreen = document.getElementById("quiz-screen");
    els.quizProgressLabel = document.getElementById("quiz-progress-label");
    els.progressFill = document.getElementById("progress-fill");
    els.quizTimer = document.getElementById("quiz-timer");
    els.timerValue = document.getElementById("timer-value");

    els.questionPartTag = document.getElementById("question-part-tag");
    els.questionTopic = document.getElementById("question-topic");
    els.questionText = document.getElementById("question-text");
    els.optionsList = document.getElementById("options-list");
    els.feedbackBox = document.getElementById("feedback-box");
    els.feedbackVerdict = document.getElementById("feedback-verdict");
    els.feedbackExplanation = document.getElementById("feedback-explanation");
    els.submitBtn = document.getElementById("submit-btn");
    els.nextBtn = document.getElementById("next-btn");

    els.resultsScreen = document.getElementById("results-screen");
    els.scoreNumber = document.getElementById("score-number");
    els.scoreTotal = document.getElementById("score-total");
    els.scorePercent = document.getElementById("score-percent");
    els.topicBreakdown = document.getElementById("topic-breakdown");
    els.retryBtn = document.getElementById("retry-btn");
  }

  /* ---------- Navigation ---------- */

  function bindNav() {
    els.navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.getAttribute("data-nav");
        const presetPart = btn.getAttribute("data-preset-part");
        if (presetPart) {
          state.setup.part = presetPart;
          syncPillGroup(els.partSelect, presetPart);
        }
        showView(view);
      });
    });
  }

  function showView(name) {
    els.views.forEach((section) => {
      section.classList.toggle("is-active", section.getAttribute("data-view") === name);
    });
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("data-nav") === name);
    });
    if (name === "practice") {
      resetToSetupScreen();
    }
    window.scrollTo(0, 0);
  }

  /* ---------- Load question bank ---------- */

  function loadQuestions() {
    fetch("questions.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load questions.json");
        return res.json();
      })
      .then((data) => {
        state.bank.part1 = data.part1 || [];
        state.bank.part2 = data.part2 || [];
        const total = state.bank.part1.length + state.bank.part2.length;
        if (els.statQuestions) els.statQuestions.textContent = total;
      })
      .catch((err) => {
        console.error(err);
        if (els.setupNote) {
          els.setupNote.textContent =
            "Question bank could not be loaded. Make sure questions.json is in the same folder as index.html.";
        }
      });
  }

  /* ---------- Setup screen controls ---------- */

  function bindSetupControls() {
    bindPillGroup(els.partSelect, (value) => (state.setup.part = value));
    bindPillGroup(els.countSelect, (value) => {
      state.setup.count = value === "all" ? "all" : parseInt(value, 10);
    });
    bindPillGroup(els.timerSelect, (value) => {
      state.setup.secondsPerQuestion = parseInt(value, 10);
    });

    els.startSessionBtn.addEventListener("click", startSession);
    els.retryBtn.addEventListener("click", () => showView("practice"));
  }

  function bindPillGroup(container, onSelect) {
    if (!container) return;
    container.querySelectorAll(".pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        container.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        onSelect(pill.getAttribute("data-value"));
      });
    });
  }

  function syncPillGroup(container, value) {
    if (!container) return;
    container.querySelectorAll(".pill").forEach((pill) => {
      pill.classList.toggle("active", pill.getAttribute("data-value") === value);
    });
  }

  function resetToSetupScreen() {
    clearTimer();
    els.practiceSetup.hidden = false;
    els.quizScreen.hidden = true;
    els.resultsScreen.hidden = true;
    els.setupNote.textContent = "";
  }

  /* ---------- Build & start a session ---------- */

  function buildQuestionPool() {
    let pool = [];
    if (state.setup.part === "both") {
      pool = state.bank.part1.concat(state.bank.part2);
    } else {
      pool = state.bank[state.setup.part].slice();
    }
    // shuffle (Fisher–Yates)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    if (state.setup.count !== "all") {
      pool = pool.slice(0, state.setup.count);
    }
    return pool;
  }

  function startSession() {
    const pool = buildQuestionPool();
    if (pool.length === 0) {
      els.setupNote.textContent = "No questions are available yet for that selection.";
      return;
    }
    state.session.questions = pool;
    state.session.index = 0;
    state.session.answers = [];

    els.practiceSetup.hidden = true;
    els.resultsScreen.hidden = true;
    els.quizScreen.hidden = false;

    renderQuestion();
  }

  /* ---------- Rendering a question ---------- */

  function currentQuestion() {
    return state.session.questions[state.session.index];
  }

  function renderQuestion() {
    clearTimer();
    const q = currentQuestion();
    const total = state.session.questions.length;
    const num = state.session.index + 1;

    els.quizProgressLabel.textContent = `Question ${num} of ${total}`;
    els.progressFill.style.width = `${((num - 1) / total) * 100}%`;

    const isPart1 = state.bank.part1.some((item) => item.id === q.id);
    els.questionPartTag.textContent = isPart1 ? "Part 1" : "Part 2";
    els.questionTopic.textContent = q.topic;
    els.questionText.textContent = q.question;

    els.optionsList.innerHTML = "";
    const letters = ["A", "B", "C", "D", "E", "F"];
    q.options.forEach((optionText, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-item";
      btn.setAttribute("data-index", idx);
      btn.innerHTML = `<span class="option-letter">${letters[idx]}</span><span>${escapeHtml(optionText)}</span>`;
      btn.addEventListener("click", () => selectOption(idx));
      els.optionsList.appendChild(btn);
    });

    els.feedbackBox.hidden = true;
    els.submitBtn.hidden = false;
    els.submitBtn.disabled = true;
    els.nextBtn.hidden = true;

    state.session.selected = null;

    if (state.setup.secondsPerQuestion > 0) {
      startTimer(state.setup.secondsPerQuestion);
    } else {
      els.quizTimer.hidden = true;
    }
  }

  function selectOption(idx) {
    if (els.submitBtn.hidden) return; // already answered
    state.session.selected = idx;
    els.optionsList.querySelectorAll(".option-item").forEach((el) => {
      el.classList.toggle("selected", parseInt(el.getAttribute("data-index"), 10) === idx);
    });
    els.submitBtn.disabled = false;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Timer ---------- */

  function startTimer(seconds) {
    els.quizTimer.hidden = false;
    state.session.timeLeft = seconds;
    updateTimerDisplay();
    state.session.timerId = setInterval(() => {
      state.session.timeLeft -= 1;
      updateTimerDisplay();
      if (state.session.timeLeft <= 0) {
        clearTimer();
        forceSubmit();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const t = Math.max(0, state.session.timeLeft);
    const mins = Math.floor(t / 60).toString().padStart(2, "0");
    const secs = (t % 60).toString().padStart(2, "0");
    els.timerValue.textContent = `${mins}:${secs}`;
    els.timerValue.classList.toggle("timer-warn", t <= 10);
  }

  function clearTimer() {
    if (state.session.timerId) {
      clearInterval(state.session.timerId);
      state.session.timerId = null;
    }
  }

  function forceSubmit() {
    // Time ran out: submit with whatever (or no) selection made
    submitAnswer(true);
  }

  /* ---------- Submit / feedback ---------- */

  function bindQuizActions() {
    els.submitBtn.addEventListener("click", () => submitAnswer(false));
    els.nextBtn.addEventListener("click", goToNextQuestion);
  }

  function submitAnswer(timedOut) {
    clearTimer();
    const q = currentQuestion();
    const selected = state.session.selected;
    const isCorrect = selected === q.correctIndex;

    els.optionsList.querySelectorAll(".option-item").forEach((el) => {
      const idx = parseInt(el.getAttribute("data-index"), 10);
      el.disabled = true;
      if (idx === q.correctIndex) el.classList.add("correct");
      if (idx === selected && idx !== q.correctIndex) el.classList.add("incorrect");
    });

    els.feedbackBox.hidden = false;
    if (selected === null || selected === undefined) {
      els.feedbackVerdict.textContent = timedOut ? "Time's up — no answer selected" : "No answer selected";
      els.feedbackVerdict.className = "feedback-verdict is-incorrect";
    } else {
      els.feedbackVerdict.textContent = isCorrect ? "Correct" : "Incorrect";
      els.feedbackVerdict.className = "feedback-verdict " + (isCorrect ? "is-correct" : "is-incorrect");
    }
    els.feedbackExplanation.textContent = q.explanation;

    const isPart1 = state.bank.part1.some((item) => item.id === q.id);
    state.session.answers.push({
      correct: !!isCorrect,
      topic: q.topic,
      part: isPart1 ? "part1" : "part2"
    });

    els.submitBtn.hidden = true;
    els.nextBtn.hidden = false;
    els.nextBtn.textContent =
      state.session.index + 1 < state.session.questions.length ? "Next question" : "See my results";
  }

  function goToNextQuestion() {
    state.session.index += 1;
    if (state.session.index >= state.session.questions.length) {
      showResults();
    } else {
      renderQuestion();
    }
  }

  /* ---------- Results ---------- */

  function showResults() {
    els.quizScreen.hidden = true;
    els.resultsScreen.hidden = false;

    const answers = state.session.answers;
    const total = answers.length;
    const correctCount = answers.filter((a) => a.correct).length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    els.scoreNumber.textContent = correctCount;
    els.scoreTotal.textContent = total;
    els.scorePercent.textContent = `${pct}% accuracy`;

    // Per-topic breakdown
    const byTopic = {};
    answers.forEach((a) => {
      if (!byTopic[a.topic]) byTopic[a.topic] = { correct: 0, total: 0 };
      byTopic[a.topic].total += 1;
      if (a.correct) byTopic[a.topic].correct += 1;
    });

    els.topicBreakdown.innerHTML = "";
    Object.keys(byTopic).forEach((topic) => {
      const row = document.createElement("div");
      row.className = "breakdown-row";
      row.innerHTML = `<span>${escapeHtml(topic)}</span><span>${byTopic[topic].correct} / ${byTopic[topic].total}</span>`;
      els.topicBreakdown.appendChild(row);
    });

    window.scrollTo(0, 0);
  }

  /* ---------- Wire up quiz action buttons once ---------- */
  document.addEventListener("DOMContentLoaded", bindQuizActions);

})();

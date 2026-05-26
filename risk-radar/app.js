const siteData = {
  lead_token: "demo-token",
  name: "Анна",
  stage: "Есть прототип / дизайн",
  services: ["UX и прототип", "MVP-разработка"],
  budget: "700k–1.5m"
};

const questions = [
  {
    key: "demand_signal",
    title: "Есть ли подтверждение, что это нужно рынку?",
    options: [
      "Есть оплаты / предзаказы",
      "Есть заявки или лист ожидания",
      "Были интервью / разговоры с клиентами",
      "Есть реакции на лендинг / контент",
      "Пока только гипотеза"
    ]
  },
  {
    key: "segment_clarity",
    title: "Насколько понятно, кто купит первым?",
    options: [
      "Есть точный сегмент",
      "Есть 2–3 гипотезы",
      "Аудитория пока широкая",
      "Пока не уверены"
    ]
  },
  {
    key: "mvp_scope",
    title: "Понятно ли, что войдёт в первую версию?",
    options: [
      "Да, scope зафиксирован",
      "Есть список, но он раздут",
      "Есть общее видение",
      "Пока не понятно, что делать первым"
    ]
  },
  {
    key: "uncertainty_zones",
    type: "multi",
    title: "Где сейчас больше всего неопределённости?",
    hint: "Можно выбрать несколько зон внимания.",
    options: [
      "Продукт / гипотеза",
      "Рынок / конкуренты",
      "Техника / интеграции",
      "Юридическая часть / данные / платежи",
      "Команда / подрядчики",
      "Продажи / первые клиенты"
    ]
  },
  {
    key: "main_risk",
    title: "Что больше всего не хочется потерять?",
    options: [
      "Деньги на разработку",
      "Время",
      "Фокус команды",
      "Первых клиентов",
      "Репутацию",
      "Скорость выхода на рынок"
    ]
  },
  {
    key: "timeline",
    title: "Когда нужен первый проверяемый результат?",
    options: [
      "2–5 дней",
      "1–2 недели",
      "3–6 недель",
      "2–3 месяца",
      "Сначала нужна стратегия / архитектура"
    ]
  }
];

const state = {
  step: -1,
  answers: {}
};

const screens = document.querySelectorAll(".screen");
const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");
const stepCounter = document.getElementById("stepCounter");
const questionTitle = document.getElementById("questionTitle");
const questionHint = document.getElementById("questionHint");
const questionEyebrow = document.getElementById("questionEyebrow");
const optionsEl = document.getElementById("options");
const nextButton = document.querySelector("[data-next]");

function saveDraft() {
  localStorage.setItem("atomicsRiskRadarDraft", JSON.stringify({
    lead_token: siteData.lead_token,
    site_data: siteData,
    answers: state.answers,
    step: state.step,
    updated_at: new Date().toISOString()
  }));
}

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === name);
  });
  progressWrap.hidden = name !== "question";
}

function renderProgress() {
  const current = state.step + 1;
  stepCounter.textContent = `${current}/6`;
  progressBar.style.width = `${(current / questions.length) * 100}%`;
}

function getAnswer(question) {
  return state.answers[question.key];
}

function hasAnswer(question) {
  const answer = getAnswer(question);
  return Array.isArray(answer) ? answer.length > 0 : Boolean(answer);
}

function renderQuestion() {
  const question = questions[state.step];
  renderProgress();
  questionTitle.textContent = question.title;
  questionHint.textContent = question.hint || "";
  questionEyebrow.textContent = question.type === "multi" ? "мультивыбор" : "зона внимания";
  nextButton.hidden = question.type !== "multi";
  nextButton.disabled = !hasAnswer(question);

  optionsEl.innerHTML = "";
  question.options.forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-card";
    button.textContent = label;

    const answer = getAnswer(question);
    const selected = Array.isArray(answer) ? answer.includes(label) : answer === label;
    button.classList.toggle("selected", selected);

    button.addEventListener("click", () => selectOption(question, label));
    optionsEl.appendChild(button);
  });

  showScreen("question");
  saveDraft();
}

function selectOption(question, label) {
  if (question.type === "multi") {
    const current = Array.isArray(state.answers[question.key]) ? [...state.answers[question.key]] : [];
    const index = current.indexOf(label);
    if (index >= 0) current.splice(index, 1);
    else current.push(label);
    state.answers[question.key] = current;
    renderQuestion();
    return;
  }

  state.answers[question.key] = label;
  saveDraft();
  window.setTimeout(() => goNext(), 170);
}

function goNext() {
  if (state.step < questions.length - 1) {
    state.step += 1;
    renderQuestion();
    return;
  }
  showScreen("final");
  progressWrap.hidden = true;
}

function goBack() {
  if (state.step > 0) {
    state.step -= 1;
    renderQuestion();
    return;
  }
  state.step = -1;
  showScreen("intro");
  progressWrap.hidden = true;
  saveDraft();
}

function buildPayload() {
  return {
    lead_token: siteData.lead_token,
    source: "telegram_mini_app",
    site_data: {
      name: siteData.name,
      stage: siteData.stage,
      services: siteData.services,
      budget: siteData.budget
    },
    answers: {
      demand_signal: state.answers.demand_signal || "",
      segment_clarity: state.answers.segment_clarity || "",
      mvp_scope: state.answers.mvp_scope || "",
      uncertainty_zones: state.answers.uncertainty_zones || [],
      main_risk: state.answers.main_risk || "",
      timeline: state.answers.timeline || ""
    },
    completed_at: new Date().toISOString()
  };
}

function submitRadar() {
  const payload = buildPayload();
  localStorage.setItem("atomicsRiskRadarCompleted", JSON.stringify(payload));
  console.log(payload);
  showScreen("success");
  progressWrap.hidden = true;
}

document.querySelector("[data-start]").addEventListener("click", () => {
  state.step = 0;
  renderQuestion();
});

document.querySelector("[data-back]").addEventListener("click", goBack);
document.querySelector("[data-back-final]").addEventListener("click", () => {
  state.step = questions.length - 1;
  renderQuestion();
});
document.querySelector("[data-next]").addEventListener("click", () => {
  const question = questions[state.step];
  if (hasAnswer(question)) goNext();
});
document.querySelector("[data-submit]").addEventListener("click", submitRadar);

showScreen("intro");

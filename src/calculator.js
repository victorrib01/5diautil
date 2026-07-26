import { calculateBusinessDay, months, ordinals } from './business-days.js';

const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');
const btnToday = document.getElementById('btnToday');
const monthNameEl = document.getElementById('monthName');
const monthYearEl = document.getElementById('monthYear');
const answerLabel = document.getElementById('answerLabel');
const resultDate = document.getElementById('resultDate');
const resultWeekday = document.getElementById('resultWeekday');
const resultFullDate = document.getElementById('resultFullDate');
const countdownEl = document.getElementById('countdown');
const speakBtn = document.getElementById('speakBtn');
const speakLabel = document.getElementById('speakLabel');
const calendarGrid = document.getElementById('calendarGrid');
const holidaysList = document.getElementById('holidaysList');
const chips = Array.from(document.querySelectorAll('.chip'));

const today = new Date();
const currentYear = today.getFullYear();
const minYear = currentYear - 1;
const maxYear = currentYear + 5;

const state = {
  month: today.getMonth(),
  year: currentYear,
  target: 5,
};

months.forEach((m, i) => monthSelect.add(new Option(m, i)));
for (let i = minYear; i <= maxYear; i++) {
  yearSelect.add(new Option(i, i));
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildCountdown(payday) {
  if (!payday) return null;
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((payday - todayZero) / 86400000);

  if (diffDays === 0) return { text: 'O pagamento é hoje', speech: 'O pagamento é hoje!' };
  if (diffDays === 1) return { text: 'O pagamento é amanhã', speech: 'O pagamento é amanhã.' };
  if (diffDays > 1 && diffDays <= 60) return { text: `Faltam ${diffDays} dias`, speech: `Faltam ${diffDays} dias.` };
  if (diffDays < 0 && state.year === today.getFullYear() && state.month === today.getMonth()) {
    return { text: 'Este pagamento já caiu', speech: 'Este pagamento já caiu.' };
  }
  return null;
}

function renderCalendar(payday, holidaysInMonth) {
  calendarGrid.innerHTML = '';
  const firstWeekday = new Date(state.year, state.month, 1).getDay();
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  const holidayDays = new Set(holidaysInMonth.map((h) => h.d));

  for (let i = 0; i < firstWeekday; i++) {
    calendarGrid.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    cell.textContent = d;

    const weekday = new Date(state.year, state.month, d).getDay();
    if (weekday === 0 || weekday === 6) cell.classList.add('weekend');
    if (holidayDays.has(d)) cell.classList.add('holiday');
    if (payday && d === payday.getDate()) cell.classList.add('payday');
    if (state.year === today.getFullYear() && state.month === today.getMonth() && d === today.getDate()) {
      cell.classList.add('today');
    }
    calendarGrid.appendChild(cell);
  }
}

function renderHolidays(holidaysInMonth) {
  holidaysList.innerHTML = '';
  if (holidaysInMonth.length === 0) {
    const p = document.createElement('p');
    p.className = 'no-holidays';
    p.textContent = 'Este mês não tem feriado nacional.';
    holidaysList.appendChild(p);
    return;
  }
  holidaysInMonth
    .slice()
    .sort((a, b) => a.d - b.d)
    .forEach((h) => {
      const item = document.createElement('div');
      item.className = 'holiday-item';
      const name = document.createElement('span');
      name.textContent = h.name;
      const date = document.createElement('span');
      date.className = 'holiday-date';
      date.textContent = `${String(h.d).padStart(2, '0')}/${String(h.m + 1).padStart(2, '0')}`;
      item.append(name, date);
      holidaysList.appendChild(item);
    });
}

function buildSpeech(payday, countdown) {
  const monthName = months[state.month];
  if (!payday) return `Não foi possível calcular o ${ordinals[state.target]} dia útil de ${monthName}.`;
  const weekday = payday.toLocaleDateString('pt-BR', { weekday: 'long' });
  const base = state.target === 5
    ? `O pagamento de ${monthName} de ${state.year} cai na ${weekday}, dia ${payday.getDate()}.`
    : `O ${ordinals[state.target]} dia útil de ${monthName} de ${state.year} é ${weekday}, dia ${payday.getDate()}.`;
  return countdown ? `${base} ${countdown.speech}` : base;
}

let currentSpeech = '';

function render() {
  const result = calculateBusinessDay(state.year, state.month, state.target);
  const payday = result.date;
  const monthName = months[state.month];

  monthSelect.value = state.month;
  yearSelect.value = state.year;
  monthNameEl.textContent = monthName;
  monthYearEl.textContent = state.year;

  prevBtn.disabled = state.year === minYear && state.month === 0;
  nextBtn.disabled = state.year === maxYear && state.month === 11;

  const isCurrentMonth = state.year === today.getFullYear() && state.month === today.getMonth();
  btnToday.classList.toggle('hidden', isCurrentMonth);

  answerLabel.textContent = state.target === 5
    ? `O pagamento de ${monthName.toLowerCase()} cai no dia:`
    : `O ${state.target}º dia útil de ${monthName.toLowerCase()} é o dia:`;

  if (payday) {
    resultDate.textContent = payday.getDate();
    resultWeekday.textContent = capitalize(payday.toLocaleDateString('pt-BR', { weekday: 'long' }));
    resultFullDate.textContent = payday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  } else {
    resultDate.textContent = '--';
    resultWeekday.textContent = 'Data inválida';
    resultFullDate.textContent = '';
  }

  const countdown = buildCountdown(payday);
  countdownEl.classList.toggle('hidden', !countdown);
  countdownEl.textContent = countdown ? countdown.text : '';

  currentSpeech = buildSpeech(payday, countdown);

  renderCalendar(payday, result.holidaysInMonth);
  renderHolidays(result.holidaysInMonth);
}

function changeMonth(delta) {
  let month = state.month + delta;
  let year = state.year;
  if (month < 0) {
    month = 11;
    year--;
  } else if (month > 11) {
    month = 0;
    year++;
  }
  if (year < minYear || year > maxYear) return;
  state.month = month;
  state.year = year;
  render();
}

prevBtn.addEventListener('click', () => changeMonth(-1));
nextBtn.addEventListener('click', () => changeMonth(1));

btnToday.addEventListener('click', () => {
  state.month = today.getMonth();
  state.year = today.getFullYear();
  render();
});

monthSelect.addEventListener('change', () => {
  state.month = parseInt(monthSelect.value, 10);
  render();
});

yearSelect.addEventListener('change', () => {
  state.year = parseInt(yearSelect.value, 10);
  render();
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    state.target = parseInt(chip.dataset.target, 10);
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    render();
  });
});

if ('speechSynthesis' in window) {
  speakBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentSpeech);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt'));
    if (voice) utterance.voice = voice;
    speakLabel.textContent = 'Falando...';
    const restore = () => {
      speakLabel.textContent = 'Ouvir a resposta';
    };
    utterance.onend = restore;
    utterance.onerror = restore;
    window.speechSynthesis.speak(utterance);
  });
} else {
  speakBtn.classList.add('hidden');
}

render();

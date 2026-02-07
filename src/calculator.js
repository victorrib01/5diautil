function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getHolidays(year) {
  const easter = getEasterDate(year);
  const carnival = new Date(easter);
  carnival.setDate(easter.getDate() - 47);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);

  const holidays = [
    { d: 1, m: 0, name: 'Confraternização Universal' },
    { d: carnival.getDate(), m: carnival.getMonth(), name: 'Carnaval (Facultativo)' },
    { d: goodFriday.getDate(), m: goodFriday.getMonth(), name: 'Sexta-feira Santa' },
    { d: 21, m: 3, name: 'Tiradentes' },
    { d: 1, m: 4, name: 'Dia do Trabalho' },
    { d: corpusChristi.getDate(), m: corpusChristi.getMonth(), name: 'Corpus Christi' },
    { d: 7, m: 8, name: 'Independência do Brasil' },
    { d: 12, m: 9, name: 'Nossa Sra. Aparecida' },
    { d: 2, m: 10, name: 'Finados' },
    { d: 15, m: 10, name: 'Proclamação da República' },
    { d: 20, m: 10, name: 'Dia da Consciência Negra' },
    { d: 25, m: 11, name: 'Natal' },
  ];
  return holidays;
}

function isBusinessDay(date, holidays) {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  const isHoliday = holidays.some((h) => h.d === date.getDate() && h.m === date.getMonth());
  return !isHoliday;
}

function calculateBusinessDay(year, month, targetCount) {
  const holidays = getHolidays(year);
  let count = 0;
  let day = 1;
  let finalDate = null;

  while (count < targetCount) {
    const currentDate = new Date(year, month, day);
    if (currentDate.getMonth() !== month) break;
    if (isBusinessDay(currentDate, holidays)) count++;
    if (count === targetCount) finalDate = currentDate;
    day++;
  }
  return {
    date: finalDate,
    holidaysInMonth: holidays.filter((h) => h.m === month),
  };
}

const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const targetSelect = document.getElementById('targetDay');

const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
months.forEach((m, i) => monthSelect.add(new Option(m, i)));

const currentYear = new Date().getFullYear();
for (let i = currentYear - 1; i <= currentYear + 5; i++) {
  yearSelect.add(new Option(i, i));
}

const today = new Date();
monthSelect.value = today.getMonth();
yearSelect.value = today.getFullYear();

function updateUI() {
  const month = parseInt(monthSelect.value, 10);
  const year = parseInt(yearSelect.value, 10);
  const target = parseInt(targetSelect.value, 10);
  const result = calculateBusinessDay(year, month, target);

  const dateDisplay = document.getElementById('resultDate');
  const weekdayDisplay = document.getElementById('resultWeekday');
  const holidaysList = document.getElementById('holidaysList');

  if (result.date) {
    dateDisplay.textContent = result.date.toLocaleDateString('pt-BR');
    weekdayDisplay.textContent = result.date.toLocaleDateString('pt-BR', { weekday: 'long' });
  } else {
    dateDisplay.textContent = 'Erro';
    weekdayDisplay.textContent = 'Data inválida';
  }

  holidaysList.innerHTML = result.holidaysInMonth.length > 0 ? '<strong>Feriados/Facultativos no mês:</strong><br>' : '';
  result.holidaysInMonth
    .sort((a, b) => a.d - b.d)
    .forEach((h) => {
      holidaysList.innerHTML += `<div class="holiday-item"><span>${h.name}</span><span class="holiday-date">${h.d}/${h.m + 1}</span></div>`;
    });
}

monthSelect.addEventListener('change', updateUI);
yearSelect.addEventListener('change', updateUI);
targetSelect.addEventListener('change', updateUI);
updateUI();

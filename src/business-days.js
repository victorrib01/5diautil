// Lógica pura de dias úteis e feriados nacionais.
// Usada pelo calculador no navegador (src/calculator.js) e pelo gerador de
// páginas estáticas no build (scripts/generate-pages.mjs) — manter sem DOM.

export function getEasterDate(year) {
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

export function getHolidays(year) {
  const easter = getEasterDate(year);
  const carnival = new Date(easter);
  carnival.setDate(easter.getDate() - 47);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);

  return [
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
}

export function isBusinessDay(date, holidays) {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  const isHoliday = holidays.some((h) => h.d === date.getDate() && h.m === date.getMonth());
  return !isHoliday;
}

export function calculateBusinessDay(year, month, targetCount) {
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

// Lista os N primeiros dias úteis do mês (números dos dias).
export function firstBusinessDays(year, month, howMany) {
  const holidays = getHolidays(year);
  const days = [];
  for (let day = 1; days.length < howMany; day++) {
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) break;
    if (isBusinessDay(date, holidays)) days.push(day);
  }
  return days;
}

export const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const ordinals = { 1: 'primeiro', 5: 'quinto', 10: 'décimo', 15: 'décimo quinto' };

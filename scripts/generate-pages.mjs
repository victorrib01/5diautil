// Gera, após o `vite build`, uma página estática por mês (ex.: dist/agosto-2026/)
// e o sitemap.xml completo. Usa a mesma lógica de src/business-days.js do
// calculador, então as datas nunca divergem do site.
//
// Manutenção anual: perto do fim do ano, adicione o próximo ano em YEARS
// (mantendo os anos que a tabela do index.html mostra) — ver MEMORY do projeto.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateBusinessDay, firstBusinessDays, months } from '../src/business-days.js';

const YEARS = [2026, 2027];
const SITE = 'https://www.5diautil.com.br';
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

if (!existsSync(DIST)) {
  console.error('dist/ não encontrado — rode `vite build` antes.');
  process.exit(1);
}

const slugify = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const pad2 = (n) => String(n).padStart(2, '0');
const weekdayOf = (date) => date.toLocaleDateString('pt-BR', { weekday: 'long' });
const fullDate = (date) => date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const listPt = (nums) => nums.length > 1 ? `${nums.slice(0, -1).join(', ')} e ${nums[nums.length - 1]}` : String(nums[0] ?? '');

// Todos os meses na ordem, com slug e datas calculadas
const pages = YEARS.flatMap((year) =>
  months.map((monthName, month) => {
    const fifth = calculateBusinessDay(year, month, 5);
    return {
      year,
      month,
      monthName,
      monthLower: monthName.toLowerCase(),
      slug: `${slugify(monthName)}-${year}`,
      date: fifth.date,
      holidays: fifth.holidaysInMonth.slice().sort((a, b) => a.d - b.d),
      firstFive: firstBusinessDays(year, month, 5),
      others: [1, 10, 15].map((target) => ({ target, date: calculateBusinessDay(year, month, target).date })),
    };
  })
);

const CSS = `
:root{--verde-900:#08432d;--verde-800:#0b5d3f;--verde-700:#0e6e4b;--verde-claro:#eaf3ee;--foco:#f59e0b;--fundo:#f4f6f5;--cartao:#fff;--borda:#dfe5e2;--tinta:#1e2a24;--tinta-suave:#57655e;--rosa-feriado:#fdecec;--vermelho-feriado:#b42318;--raio:14px}
*{box-sizing:border-box}
html{font-size:112.5%;-webkit-text-size-adjust:100%}
body{font-family:"Inter","Segoe UI",system-ui,sans-serif;background:var(--fundo);color:var(--tinta);margin:0;min-height:100vh;line-height:1.55}
body::before{content:"";display:block;height:4px;background:var(--verde-800)}
.page{max-width:34rem;margin:0 auto;padding:1.5rem 1rem 3rem}
:focus-visible{outline:3px solid var(--foco);outline-offset:2px;border-radius:8px}
.brand{display:flex;align-items:center;gap:.85rem;margin-bottom:.9rem}
.brand a{display:flex;align-items:center;gap:.85rem;text-decoration:none;color:inherit}
.brand-name{margin:0;font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--verde-700)}
.page-title{margin:0 0 .6rem;font-size:1.45rem;font-weight:800;line-height:1.25;letter-spacing:-.01em}
.intro{font-size:.98rem;color:var(--tinta-suave);margin:0 0 1.4rem}
.card{background:var(--cartao);border:1px solid var(--borda);border-radius:var(--raio);padding:1.4rem 1.3rem;box-shadow:0 1px 3px rgba(15,40,30,.05);margin-bottom:1rem}
.card h2{font-size:1.1rem;font-weight:700;margin:0 0 .6rem}
.answer-card{background:var(--verde-800);border-radius:16px;padding:1.7rem 1.3rem 1.5rem;margin-bottom:1rem;text-align:center;color:#fff;box-shadow:0 2px 8px rgba(8,67,45,.2)}
.answer-label{margin:0 0 .4rem;font-size:1.1rem;font-weight:600;color:#cfe6da}
.big-date{font-size:clamp(4.5rem,24vw,6.5rem);font-weight:800;line-height:1;margin:0;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.weekday{font-size:1.45rem;font-weight:700;margin-top:.35rem}
.full-date{font-size:1rem;font-weight:600;color:#b9d8c9;margin-top:.15rem}
.card p{font-size:.98rem;color:var(--tinta-suave);margin:0 0 1rem}
.card p:last-child{margin-bottom:0}
table{width:100%;border-collapse:collapse;font-size:.98rem}
th,td{text-align:left;padding:.5rem .6rem;border-bottom:1px solid var(--borda)}
thead th{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--tinta-suave)}
tbody th{font-weight:600}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:none}
td{font-variant-numeric:tabular-nums}
tr.destaque th,tr.destaque td{background:var(--verde-claro);font-weight:700}
.holiday-item{display:flex;justify-content:space-between;align-items:center;gap:.75rem;padding:.55rem 0;font-size:1rem}
.holiday-item+.holiday-item{border-top:1px solid var(--borda)}
.holiday-date{flex-shrink:0;background:var(--rosa-feriado);color:var(--vermelho-feriado);font-weight:700;padding:.2rem .65rem;border-radius:999px;font-size:.9rem;font-variant-numeric:tabular-nums}
.faq details{border-bottom:1px solid var(--borda)}
.faq details:last-of-type{border-bottom:none}
.faq summary{cursor:pointer;font-size:1rem;font-weight:700;padding:.75rem .2rem}
.faq p{margin:.1rem 0 .9rem;font-size:.98rem;color:var(--tinta-suave)}
.nav-links{display:grid;gap:.6rem}
.nav-links a{display:block;background:#fff;border:1.5px solid var(--borda);border-radius:12px;min-height:52px;padding:.75rem 1rem;text-decoration:none;color:var(--verde-800);font-weight:700;font-size:1rem}
.nav-links a:hover{background:var(--verde-claro);border-color:var(--verde-700)}
.cta{display:block;text-align:center;background:var(--verde-800);color:#fff;border-radius:12px;min-height:58px;padding:.95rem 1rem;text-decoration:none;font-weight:700;font-size:1.1rem;margin-bottom:1rem}
.cta:hover{background:var(--verde-900)}
.footer{text-align:center;font-size:.88rem;color:var(--tinta-suave);padding-top:.5rem}
.footer a{color:var(--verde-700);text-decoration:none;font-weight:700}
.footer a:hover{text-decoration:underline}
`.trim();

const LOGO = '<svg viewBox="0 0 48 48" width="44" height="44" role="img" aria-label="Logotipo 5º Dia Útil"><rect x="3" y="6" width="42" height="39" rx="9" fill="#0b5d3f"/><path d="M3 15 h42 v3 H3 z" fill="#08432d"/><rect x="3" y="6" width="42" height="9" rx="4.5" fill="#08432d"/><rect x="12" y="2" width="5" height="9" rx="2.5" fill="#08432d"/><rect x="31" y="2" width="5" height="9" rx="2.5" fill="#08432d"/><text x="24" y="38" font-size="18" font-weight="800" text-anchor="middle" fill="#ffffff" font-family="Inter, sans-serif">5º</text></svg>';

function renderPage(page, index) {
  const { year, monthName, monthLower, slug, date, holidays, firstFive, others } = page;
  const dd = pad2(date.getDate());
  const mm = pad2(date.getMonth() + 1);
  const weekday = weekdayOf(date);
  const prev = pages[index - 1];
  const next = pages[index + 1];
  const sameMonthOtherYear = pages.find((p) => p.month === page.month && p.year !== year);

  const holidayBefore = holidays.find((h) => h.d <= date.getDate());
  let pushNote = '';
  if (holidayBefore) {
    const diaTexto = holidayBefore.d === 1 ? '1º' : `o dia ${holidayBefore.d}`;
    const nomeFeriado = holidayBefore.name.replace(' (Facultativo)', ' (ponto facultativo)');
    pushNote = ` Como ${diaTexto} de ${monthLower} é ${nomeFeriado}, a contagem dos dias úteis fica mais espaçada neste mês.`;
  }

  const holidayNames = holidays.map((h) => `${h.name} (${pad2(h.d)}/${pad2(h.m + 1)})`).join(', ');

  const faq = [
    {
      q: `Quando cai o 5º dia útil de ${monthLower} de ${year}?`,
      a: `O 5º dia útil de ${monthLower} de ${year} é ${weekday}, dia ${date.getDate()}. Os cinco primeiros dias úteis do mês são os dias ${listPt(firstFive)}.`,
    },
    {
      q: `Quando cai o pagamento em ${monthLower} de ${year}?`,
      a: `Pela CLT (artigo 459, §1º), o salário mensal deve ser pago até o 5º dia útil do mês seguinte ao trabalhado. Em ${monthLower} de ${year}, isso significa até ${weekday}, ${fullDate(date)}.`,
    },
    {
      q: `${monthName} de ${year} tem feriado?`,
      a: holidays.length
        ? `Sim. Feriados nacionais em ${monthLower} de ${year}: ${holidayNames}.`
        : `Não. ${monthName} de ${year} não tem feriado nacional, então os dias úteis seguem apenas o calendário de segunda a sexta-feira.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: `5º dia útil de ${monthLower} de ${year}`, item: `${SITE}/${slug}/` },
    ],
  };

  const title = `5º Dia Útil de ${monthName} de ${year}: ${dd}/${mm} (${weekday})`;
  const description = `O 5º dia útil de ${monthLower} de ${year} cai na ${weekday}, dia ${date.getDate()}. Veja também o 1º, 10º e 15º dia útil, os feriados do mês e quando o pagamento cai.`;

  const holidaysHtml = holidays.length
    ? holidays.map((h) => `<div class="holiday-item"><span>${h.name}</span><span class="holiday-date">${pad2(h.d)}/${pad2(h.m + 1)}</span></div>`).join('\n          ')
    : `<p>${monthName} de ${year} não tem feriado nacional.</p>`;

  const othersRows = [
    { target: 1, label: '1º dia útil', date: others[0].date },
    { target: 5, label: '5º dia útil', date, destaque: true },
    { target: 10, label: '10º dia útil', date: others[1].date },
    { target: 15, label: '15º dia útil', date: others[2].date },
  ]
    .map((r) => `<tr${r.destaque ? ' class="destaque"' : ''}><th scope="row">${r.label}</th><td>${pad2(r.date.getDate())}/${pad2(r.date.getMonth() + 1)}/${year}</td><td>${weekdayOf(r.date)}</td></tr>`)
    .join('\n              ');

  const navLinks = [
    prev && `<a href="/${prev.slug}/">Mês anterior: ${prev.monthLower} de ${prev.year}</a>`,
    next && `<a href="/${next.slug}/">Próximo mês: ${next.monthLower} de ${next.year}</a>`,
    sameMonthOtherYear && `<a href="/${sameMonthOtherYear.slug}/">${monthName} de ${sameMonthOtherYear.year}</a>`,
  ].filter(Boolean).join('\n          ');

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="Victor Ribeiro" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <link rel="canonical" href="${SITE}/${slug}/" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
    <meta name="theme-color" content="#0b5d3f" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon-192.png" type="image/png" sizes="192x192" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="5º Dia Útil" />
    <meta property="og:url" content="${SITE}/${slug}/" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${SITE}/og-image.jpg" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${SITE}/og-image.jpg" />
    <style>${CSS}</style>
    <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  </head>
  <body>
    <main class="page">
      <header class="brand">
        <a href="/">
          ${LOGO}
          <span class="brand-name">5º Dia Útil</span>
        </a>
      </header>
      <h1 class="page-title">5º dia útil de ${monthLower} de ${year}</h1>

      <p class="intro">Data já calculada descontando fins de semana e todos os <strong>feriados nacionais</strong>. É a referência mais comum para o <strong>dia do pagamento</strong>.</p>

      <section class="answer-card" aria-label="Resultado">
        <p class="answer-label">O 5º dia útil de ${monthLower} de ${year} é:</p>
        <p class="big-date">${date.getDate()}</p>
        <p class="weekday">${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}</p>
        <p class="full-date">${fullDate(date)}</p>
      </section>

      <a class="cta" href="/">Calcular outro mês na calculadora</a>

      <section class="card" aria-label="Contagem dos dias úteis">
        <h2>Como chegamos nessa data</h2>
        <p>Os cinco primeiros dias úteis de ${monthLower} de ${year} são os dias <strong>${listPt(firstFive)}</strong>. Contam-se apenas os dias de segunda a sexta-feira que não são feriado nacional.${pushNote}</p>
        <p>Pela <strong>CLT (artigo 459, §1º)</strong>, o salário do mês trabalhado deve ser pago até o 5º dia útil do mês seguinte — por isso tantas empresas pagam exatamente nesta data.</p>
      </section>

      <section class="card" aria-label="Outros dias úteis do mês">
        <h2>1º, 10º e 15º dia útil de ${monthLower} de ${year}</h2>
        <div style="overflow-x:auto">
          <table>
            <thead>
              <tr><th scope="col">Referência</th><th scope="col">Data</th><th scope="col">Dia da semana</th></tr>
            </thead>
            <tbody>
              ${othersRows}
            </tbody>
          </table>
        </div>
      </section>

      <section class="card" aria-label="Feriados do mês">
        <h2>Feriados em ${monthLower} de ${year}</h2>
        ${holidaysHtml}
      </section>

      <section class="card faq" aria-labelledby="faqTitle">
        <h2 id="faqTitle">Perguntas frequentes</h2>
        ${faq.map(({ q, a }) => `<details>\n          <summary>${q}</summary>\n          <p>${a}</p>\n        </details>`).join('\n        ')}
      </section>

      <nav class="card" aria-label="Outros meses">
        <h2>Ver outros meses</h2>
        <div class="nav-links">
          ${navLinks}
          <a href="/">Tabela completa e calculadora do 5º dia útil</a>
        </div>
      </nav>

      <footer class="footer" role="contentinfo">
        Desenvolvido por
        <a href="https://www.victorrib.com.br" target="_blank" rel="noopener noreferrer">Victor Ribeiro</a>
        &middot;
        <a href="https://www.linkedin.com/in/victorribeiro-dev/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </footer>
    </main>
  </body>
</html>
`;
}

// Escreve as páginas
pages.forEach((page, index) => {
  const dir = join(DIST, page.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), renderPage(page, index), 'utf8');
});

// Sitemap com home + todas as páginas mensais
const today = new Date().toISOString().slice(0, 10);
const currentYear = new Date().getFullYear();
const urls = [
  `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
  ...pages.map((p) => `  <url>\n    <loc>${SITE}/${p.slug}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>${p.year === currentYear ? '0.8' : '0.6'}</priority>\n  </url>`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8');

console.log(`Geradas ${pages.length} páginas mensais + sitemap.xml (${pages.length + 1} URLs).`);

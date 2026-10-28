#!/usr/bin/env node
// Builds the EnJEL site into _site/ from src/pages, data/*.json and assets/.
// No dependencies: run with `node build.js` (or `npm run build`).
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, '_site');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJSON = (p) => {
  try { return JSON.parse(read(p)); }
  catch (e) { fail(`${p} is not valid JSON: ${e.message}`); }
};
function fail(msg) { console.error(`\nBuild failed: ${msg}\n`); process.exit(1); }

const config = readJSON('site.config.json');
const data = {
  publications: readJSON('data/publications.json'),
  projects: readJSON('data/projects.json'),
  highlights: readJSON('data/highlights.json'),
  team: readJSON('data/team.json'),
  partners: readJSON('data/partners.json'),
  support: readJSON('data/support.json'),
};

// ---------- helpers ----------
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (html) => html.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/&nbsp;/g, ' ')
  .replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '')
  .trim().replace(/[\s_]+/g, '-');

const ICON_CAMERA = '<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#555555" stroke-width="1.6"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const ICON_PERSON = '<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#555555" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>';

function checkAsset(src) {
  if (/^https?:\/\//.test(src)) return;
  if (!fs.existsSync(path.join(ROOT, src))) fail(`image not found: ${src}`);
}

// A photo slot: a real image if `src` is set, otherwise a labelled grey placeholder.
function picture(src, alt, cls = '', { eager = false } = {}) {
  checkAsset(src);
  if (!alt) fail(`image ${src} needs alt text`);
  const webp = src.replace(/\.(jpe?g|png)$/i, '.webp');
  const hasWebp = webp !== src && fs.existsSync(path.join(ROOT, webp));
  const img = `<img class="media ${cls}" src="${esc(src)}" alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async">`;
  return hasWebp ? `<picture><source srcset="${esc(webp)}" type="image/webp">${img}</picture>` : img;
}
function photoSlot(src, alt, placeholder, cls = '', opts) {
  if (src) return picture(src, alt || placeholder, cls, opts);
  return `<div class="ph ${cls}" role="img" aria-label="Photo placeholder: ${esc(placeholder)}">${ICON_CAMERA}<span>[Photo: ${esc(placeholder)}]</span></div>`;
}
function portraitSlot(person) {
  if (person.portrait) {
    checkAsset(person.portrait);
    return `<div class="portrait">${picture(person.portrait, `Portrait of ${person.name}`)}</div>`;
  }
  return `<div class="portrait"><div class="ph" role="img" aria-label="Portrait placeholder: ${esc(person.name)}">${ICON_PERSON}<span>[Portrait]</span></div></div>`;
}

// ---------- components (used as {{> name}} in src/pages) ----------
const components = {
  img(args) {
    const [src, alt, cls = '', flag = ''] = args;
    return picture(src, alt, cls, { eager: flag === 'eager' });
  },

  highlights() {
    return data.highlights.map((h) => `
        <article class="card">
          <p class="kicker">${esc(h.type)}</p>
          <h3><a href="${esc(h.url || 'research.html')}">${esc(h.title)}</a></h3>
          <p class="card-text">${esc(h.summary)}</p>
          <div class="card-foot"><span class="tag">${esc(h.tag)}</span><span class="note">${esc(h.note)}</span></div>
        </article>`).join('');
  },

  homeProjects() {
    return data.projects.filter((p) => p.home).sort((a, b) => a.home.order - b.home.order).map((p) => {
      const h = p.home;
      const img = h.image !== undefined ? h.image : p.image;
      const alt = h.alt !== undefined ? h.alt : p.alt;
      return `
        <a class="proj-card" href="projects.html#${esc(p.id)}">
          ${photoSlot(img, alt, h.placeholder || p.placeholder, 'r-16-10')}
          <span class="proj-body">
            <span class="proj-label">${esc(h.label)}</span>
            <span class="proj-title">${esc(h.title || p.title)}</span>
            <span class="proj-text">${esc(h.summary || p.summary)}</span>
          </span>
        </a>`;
    }).join('');
  },

  teamShort() {
    return data.team.map((t) => `
      <article class="person">
        ${portraitSlot(t)}
        <div class="person-body">
          <h3>${esc(t.name)}</h3>
          <p class="role">${esc(t.role)}</p>
          <p class="bio">${esc(t.short_bio)}</p>
          ${t.linkedin ? `<a class="li-link" href="${esc(t.linkedin)}">LinkedIn →<span class="sr-only"> ${esc(t.name)}</span></a>` : ''}
        </div>
      </article>`).join('');
  },

  teamFull() {
    const list = (arr) => (arr || []).map(esc).join('<br>');
    return data.team.map((t) => `
        <article class="person-lg">
          ${portraitSlot(t)}
          <div class="person-body">
            <div>
              <h3>${esc(t.name)}</h3>
              <p class="role">${esc(t.role)}</p>
            </div>
            <p class="bio">${esc(t.bio)}</p>
            <div class="person-facts">
              <div><h4>Education</h4><p>${list(t.education)}</p></div>
              <div><h4>Expertise</h4><p>${list(t.expertise)}</p></div>
              <div><h4>Certifications</h4><p>${list(t.certifications)}</p></div>
            </div>
            ${t.linkedin ? `<a class="li-link more-link" href="${esc(t.linkedin)}">LinkedIn →<span class="sr-only"> ${esc(t.name)}</span></a>` : ''}
          </div>
        </article>`).join('');
  },

  partners() {
    return data.partners.map((p) => {
      if (p.logo) {
        checkAsset(p.logo);
        const caption = p.caption ? `<span class="logo-caption" aria-hidden="true">${esc(p.caption)}</span>` : '';
        return `<div class="logo-tile"><img src="${esc(p.logo)}" alt="${esc(p.name)} logo" loading="lazy">${caption}</div>`;
      }
      return `<div class="logo-tile" role="img" aria-label="Logo placeholder: ${esc(p.name)}">[Logo] ${esc(p.label)}</div>`;
    }).join('\n      ');
  },

  // A team photo if one is set in site.config.json, otherwise the animated logo.
  aboutTeamPhoto() {
    if (config.aboutTeamPhoto) return photoSlot(config.aboutTeamPhoto, config.aboutTeamPhotoAlt, 'EnJEL team portrait', 'r-4-3 rounded');
    const edges = [
      ['M184.9 95.9 139.2 174.1', 'e1'],
      ['M215.1 95.9 260.8 174.1', 'e2'],
      ['M154 200H246', 'e3'],
    ];
    return `<div class="logo-motion r-4-3 rounded" role="img" aria-label="Animated EnJEL logo: three connected nodes">
            <svg viewBox="0 0 400 300" aria-hidden="true" focusable="false">
              <defs><pattern id="lm-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" class="lm-dot"/></pattern></defs>
              <rect width="400" height="300" fill="url(#lm-dots)"/>
              <circle class="lm-orbit" cx="200" cy="152" r="118"/>
              <circle class="lm-orbit lm-orbit-2" cx="200" cy="152" r="134"/>
              ${edges.map(([d, c]) => `<path class="lm-edge ${c}" d="${d}" pathLength="1"/>`).join('')}
              <circle class="lm-node n1" cx="200" cy="70" r="24"/>
              <circle class="lm-node n2" cx="124" cy="200" r="24"/>
              <circle class="lm-node n3" cx="276" cy="200" r="24"/>
              ${edges.map(([d, c]) => `<circle class="lm-pulse p-${c}" r="4" style="offset-path:path('${d}')"/>`).join('')}
              <text class="lm-word" x="200" y="262" text-anchor="middle">EnJEL</text>
              <text class="lm-sub" x="200" y="284" text-anchor="middle">RESEARCH &amp; ENGINEERING</text>
            </svg>
          </div>`;
  },

  pubFilters() {
    const pubs = data.publications;
    const groups = [
      { legend: 'Pillar', key: 'pillar', options: [['Engineering', 'Engineering'], ['IT', 'Information Technology'], ['Sustainability', 'Sustainability']],
        count: (v) => pubs.filter((p) => p.pillars.includes(v)).length },
      { legend: 'Publication type', key: 'type', options: [['Journal article', 'Journal article'], ['Conference paper', 'Conference paper'], ['Manuscript', 'Manuscript'], ['Applied research', 'Applied research']],
        count: (v) => pubs.filter((p) => p.type === v).length },
      { legend: 'Status', key: 'status', options: [['published', 'Published or accepted'], ['in-progress', 'In progress']],
        count: (v) => pubs.filter((p) => p.status_group === v).length },
      { legend: 'Year', key: 'year', options: [...new Set(pubs.map((p) => String(p.year)))].sort().reverse().map((y) => [y, y]),
        count: (v) => pubs.filter((p) => String(p.year) === v).length },
    ];
    return groups.map((g) => `
        <fieldset>
          <legend>${g.legend}</legend>${g.options.map(([value, label]) => {
            const id = `f-${g.key}-${slug(value)}`;
            return `
          <div class="check"><input id="${id}" type="checkbox" name="${g.key}" value="${esc(value)}"><label for="${id}">${esc(label)}</label><span class="count">${g.count(value)}</span></div>`;
          }).join('')}
        </fieldset>`).join('');
  },

  pubCount: () => String(data.publications.length),

  pubList() {
    return data.publications.map((p, i) => {
      const authorsMain = p.authors.split(' · ')[0];
      const cite = p.type === 'Manuscript'
        ? `${authorsMain} (${p.year}). ${p.title}. Manuscript, ${p.status.toLowerCase()}.`
        : `${authorsMain} (${p.year}). ${p.title}. ${p.venue.split(' · ')[0]}.${p.doi ? ` https://doi.org/${p.doi}` : ''}`;
      const searchText = [p.title, p.authors, p.venue, p.tag, p.type, p.status, p.abstract].join(' ').toLowerCase();
      const titleHtml = p.url ? `<a href="${esc(p.url)}">${esc(p.title)}</a>` : esc(p.title);
      let abstract = '';
      if (p.abstract) abstract = `<details><summary>View abstract</summary><p>${esc(p.abstract)}</p></details>`;
      else if (p.url) abstract = `<a href="${esc(p.url)}">View abstract<span class="sr-only">: ${esc(p.title)}</span></a>`;
      return `
          <article class="pub" id="${esc(p.id)}" data-order="${i}" data-pillar="${esc(p.pillars.join('|'))}" data-type="${esc(p.type)}" data-status="${esc(p.status_group)}" data-year="${p.year}" data-title="${esc(p.title.toLowerCase())}" data-text="${esc(searchText)}">
            <div class="pub-meta">
              <span class="ptype">${esc(p.type)}</span>
              <span class="tag">${esc(p.tag)}</span>
              <span class="status">${esc(p.status)}</span>
            </div>
            <h3>${titleHtml}</h3>
            <p class="authors">${esc(p.authors)}</p>
            <p class="venue-line">${esc(p.venue)}</p>
            <div class="pub-actions">
              ${abstract}
              <button type="button" class="text-btn" data-cite="${esc(cite)}" hidden>Cite<span class="sr-only">: copy citation for ${esc(p.title)}</span></button>
              <span class="copied" role="status"></span>
            </div>
          </article>`;
    }).join('');
  },

  featuredProject() {
    const p = data.projects.find((x) => x.featured);
    if (!p) return '';
    const f = p.featured;
    return `
    <article class="featured" id="${esc(p.id)}" data-pillar="${esc(p.pillar)}">
      <div class="featured-media">
        ${photoSlot(p.image, p.alt, p.placeholder, 'r-4-3')}
      </div>
      <div class="featured-body">
        <p class="proj-label">${esc(f.label)}</p>
        <h2>${esc(p.title)}</h2>
        <p class="muted">${esc(p.summary)}</p>
        <dl class="stats">${(f.stats || []).map((s) => `
          <div><dt>${esc(s.label)}</dt><dd${s.small ? ' class="small"' : ''}>${esc(s.value)}</dd></div>`).join('')}
        </dl>
        <p class="period">${esc(p.period)}</p>
      </div>
    </article>`;
  },

  projectGrid() {
    return data.projects.filter((p) => !p.featured).map((p) => `
        <article class="pcard" id="${esc(p.id)}" data-pillar="${esc(p.pillar)}">
          ${photoSlot(p.image, p.alt, p.placeholder, 'r-16-10')}
          <div class="pcard-body">
            <div class="pcard-tags"><span class="tag">${esc(p.pillar)}</span><span class="status">${esc(p.status)}</span></div>
            <h3>${esc(p.title)}</h3>
            <p class="partner">${esc(p.partner)}</p>
            <p class="summary">${esc(p.summary)}</p>
            <p class="period">${esc(p.period)}</p>
          </div>
        </article>`).join('');
  },

  projectCount: () => String(data.projects.length),

  supportFields() {
    return data.support.filter((f) => f.items && f.items.length).map((f) => `
      <div class="field">
        <h3>${esc(f.field)}</h3>
        <ul>${f.items.map((it) => `
          <li><span class="kind">${esc(it.kind)}</span><span class="topic"><strong>${esc(it.topic)}</strong><span>${esc(it.work)}</span></span></li>`).join('')}
        </ul>
      </div>`).join('');
  },
};

// ---------- layout ----------
// Content hashes for the CSS/JS links, so browsers fetch fresh copies after each change.
const hash = (p) => require('crypto').createHash('md5').update(read(p)).digest('hex').slice(0, 8);
const ASSET_VERSION = { css: hash('assets/css/site.css'), js: hash('assets/js/site.js') };

const NAV = [
  ['research', 'research.html', 'Research'],
  ['solutions', 'solutions.html', 'Solutions'],
  ['projects', 'projects.html', 'Projects'],
  ['publications', 'research.html#publications', 'Publications'],
  ['about', 'about.html', 'About'],
  ['contact', '#contact', 'Contact'],
];
const LOGO = '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="#C2410C" stroke-width="2.2"><circle cx="20" cy="8" r="4.5"/><circle cx="8" cy="30" r="4.5"/><circle cx="32" cy="30" r="4.5"/><path d="M17.8 12 10.2 26M22.2 12l7.6 14M12.5 30h15"/></svg>';

// Business details for Google (home page only), from site.config.json.
function orgSchema(base) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EnJEL Research & Engineering',
    alternateName: config.siteName,
    url: `${base}/`,
    logo: `${base}/assets/img/enjel-logo.png`,
    email: config.email,
    telephone: config.phoneIntl,
    address: { '@type': 'PostalAddress', streetAddress: 'KNUST', addressLocality: 'Kumasi', addressCountry: 'GH' },
  }).replace(/</g, '\\u003c');
}

function layout(meta, body, file) {
  const title = meta.title ? `${meta.title} | EnJEL` : 'EnJEL | Research & Engineering';
  const base = config.siteUrl.replace(/\/$/, '');
  const url = `${base}/${file === 'index.html' ? '' : file}`;
  const nav = NAV.map(([key, href, label]) =>
    `<a href="${href}"${meta.nav === key ? ' aria-current="page"' : ''}>${label}</a>`).join('\n        ');
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(meta.description || '')}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(meta.description || '')}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${base}/assets/img/enjel-logo.png">
${meta.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`}
${file === 'index.html' ? `<script type="application/ld+json">${orgSchema(base)}</script>` : ''}
<meta name="theme-color" content="#1f1f1f">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css?v=${ASSET_VERSION.css}">
<script>document.documentElement.classList.remove('no-js');</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

<div class="utility">
  <div class="wrap">
    <nav aria-label="Audiences">
      <a href="index.html#research">For researchers</a>
      <a href="index.html#solutions">For industry</a>
      <a href="index.html#partner">For funders</a>
    </nav>
    <div class="util-right">
      <span class="util-tagline">Engineering · IT · Sustainability</span>
      <a href="#contact">Contact</a>
    </div>
  </div>
</div>

<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="index.html">
      ${LOGO}
      <span class="brand-text"><span class="brand-name">EnJEL</span><span class="brand-sub">Research &amp; Engineering</span></span>
    </a>
    <nav class="main-nav" id="main-nav" aria-label="Main">
        ${nav}
        <a class="nav-cta" href="index.html#partner">Work with us</a>
    </nav>
    <div class="header-actions">
      <a class="icon-btn" href="search.html" aria-label="Search the site"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></a>
      <a class="btn" href="index.html#partner">Work with us</a>
      <button type="button" class="icon-btn menu-toggle" aria-expanded="false" aria-controls="main-nav"><span class="sr-only">Menu</span><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div>
</header>

<main id="main">
${body}
</main>

<footer class="site-footer" id="contact">
  <div class="wrap">
    <div class="grid g-200 footer-grid">
      <div class="footer-col">
        <span class="fname">EnJEL</span>
        <span class="muted">Research, engineering and development across engineering, IT and sustainability.</span>
        <span class="muted">${esc(config.address)}</span>
        <a href="mailto:${esc(config.email)}">${esc(config.email)}</a>
        <a href="tel:${esc(config.phoneIntl)}">${esc(config.phone)}</a>
        <a href="https://enjel.org">enjel.org</a>
      </div>
      <nav class="footer-col" aria-label="Research areas">
        <span class="fhead">Research areas</span>
        <a href="research.html">Reaction engineering</a>
        <a href="research.html">Separations</a>
        <a href="research.html">Renewable energy</a>
        <a href="research.html">Techno-economics</a>
      </nav>
      <nav class="footer-col" aria-label="Solutions">
        <span class="fhead">Solutions</span>
        <a href="solutions.html#engineering">Engineering consulting</a>
        <a href="solutions.html#it">Cloud &amp; security</a>
        <a href="solutions.html#it">Data &amp; machine learning</a>
        <a href="solutions.html#sustainability">Sustainability assessment</a>
      </nav>
      <nav class="footer-col" aria-label="Company">
        <span class="fhead">Company</span>
        <a href="about.html">About us</a>
        <a href="about.html#team">Our people</a>
        <a href="projects.html">Projects</a>
        <a href="research-support.html">Research support</a>
      </nav>
      <!-- Newsletter: GitHub Pages can't receive form posts, so this posts to Formspree
           ("newsletterEndpoint" in site.config.json). -->
      <form class="footer-col" action="${esc(config.newsletterEndpoint)}" method="POST" data-newsletter>
        <label for="news-email" class="fhead">Research updates</label>
        <span class="muted" id="news-help">New publications and project news, monthly.</span>
        <div class="newsletter-row">
          <input id="news-email" name="email" type="email" placeholder="Email address" autocomplete="email" required aria-describedby="news-help">
          <input type="hidden" name="_subject" value="New EnJEL newsletter sign-up">
          <button type="submit">Subscribe</button>
        </div>
        <p class="form-status" role="status"></p>
      </form>
    </div>
    <div class="footer-bottom">
      <span>© 2026 EnJEL Research &amp; Engineering, Kumasi, Ghana.</span>
    </div>
  </div>
</footer>
<script src="assets/js/site.js?v=${ASSET_VERSION.js}" defer></script>
</body>
</html>
`;
}

// ---------- build ----------
function render(template, file) {
  return template.replace(/\{\{>\s*(\w+)\s*([^}]*)\}\}/g, (_, name, rest) => {
    const fn = components[name];
    if (!fn) fail(`${file}: unknown component {{> ${name}}}`);
    return fn(rest.split('|').map((s) => s.trim()));
  });
}

function parsePage(file) {
  const raw = read(path.join('src/pages', file));
  const m = raw.match(/^<!--\s*(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) fail(`${file} must start with a <!--{ "title": ... }--> header`);
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { fail(`${file} header is not valid JSON: ${e.message}`); }
  return { meta, template: raw.slice(m[0].length) };
}

// Search index: headings from the page templates plus every data entry.
function indexTemplate(file, meta, template) {
  const entries = [];
  const html = template.replace(/\{\{>[^}]*\}\}/g, '')
    .replace(/<(form|nav)\b[\s\S]*?<\/\1>/g, '').replace(/<div class="chips">[\s\S]*?<\/div>/g, '');
  const re = /<(h[123])\b[^>]*>([\s\S]*?)<\/\1>/g;
  const heads = [...html.matchAll(re)];
  heads.forEach((h, i) => {
    const before = html.slice(0, h.index);
    const ids = [...before.matchAll(/\bid="([^"]+)"/g)];
    const anchor = ids.length ? '#' + ids[ids.length - 1][1] : '';
    const end = i + 1 < heads.length ? heads[i + 1].index : html.length;
    const text = stripTags(html.slice(h.index + h[0].length, end)).slice(0, 400);
    const title = stripTags(h[2]);
    if (title) entries.push({ t: title, u: file + (h[1] === 'h1' ? '' : anchor), k: meta.title || 'Home', x: text });
  });
  return entries;
}

function dataIndex() {
  return [
    ...data.publications.map((p) => ({ t: p.title, u: `research.html#${p.id}`, k: 'Publication', x: [p.authors, p.venue, p.tag, p.status, p.abstract].filter(Boolean).join(' · ') })),
    ...data.highlights.map((h) => ({ t: h.title, u: h.url, k: 'Research', x: [h.summary, h.tag, h.note].join(' · ') })),
    ...data.projects.map((p) => ({ t: p.title, u: `projects.html#${p.id}`, k: 'Project', x: [p.partner, p.summary, p.pillar, p.status].join(' · ') })),
    ...data.support.flatMap((f) => f.items.map((it) => ({ t: it.topic, u: 'research-support.html', k: 'Research support', x: `${f.field} · ${it.kind} · ${it.work}` }))),
    ...data.team.map((t) => ({ t: t.name, u: 'about.html#team', k: 'People', x: `${t.role} · ${t.bio}` })),
  ];
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const dir of ['css', 'js', 'img']) copyDir(path.join(ROOT, 'assets', dir), path.join(OUT, 'assets', dir));

  const ids = new Set();
  for (const p of [...data.publications, ...data.projects]) {
    if (!p.id) fail(`an entry is missing "id": ${p.title}`);
    if (ids.has(p.id)) fail(`duplicate id "${p.id}"`);
    ids.add(p.id);
  }

  let index = [];
  const sitemap = [];
  const pages = fs.readdirSync(path.join(ROOT, 'src/pages')).filter((f) => f.endsWith('.html'));
  for (const file of pages) {
    const { meta, template } = parsePage(file);
    fs.writeFileSync(path.join(OUT, file), layout(meta, render(template, file), file));
    if (!meta.noindex) index = index.concat(indexTemplate(file, meta, template));
    if (!meta.noindex && file !== '404.html') sitemap.push(file === 'index.html' ? '' : file);
  }
  index = index.concat(dataIndex());
  fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify(index));

  // Sitemap and robots.txt for search engines (submitted in Google Search Console).
  const base = config.siteUrl.replace(/\/$/, '');
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    sitemap.map((p) => `  <url><loc>${base}/${p}</loc></url>`).join('\n') + '\n</urlset>\n');
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
  console.log(`Built ${pages.length} pages and ${index.length} search entries into _site/`);
}

build();

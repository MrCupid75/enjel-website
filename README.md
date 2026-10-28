# EnJEL website

The public website for EnJEL (research, engineering and development, Ghana).
It is a plain static site: HTML pages, one CSS file, a little JavaScript, and
JSON data files. A small script (`build.js`, no extra packages) puts the pages
together into the `_site/` folder, and GitHub publishes that folder to GitHub
Pages every time you push to `main`.

## What's where

| Path | What it is |
|---|---|
| `src/pages/*.html` | The page content (Home is `index.html`). Header and footer are added automatically. |
| `data/publications.json` | Publications on the Research page |
| `data/highlights.json` | The six research cards on the Home page |
| `data/projects.json` | Projects (Projects page, plus the Home cards via each project's `home` block) |
| `data/team.json` | Leadership bios and portraits |
| `data/partners.json` | Partner logos on the About page |
| `data/support.json` | Research support topics |
| `site.config.json` | Email, newsletter form address, About team photo |
| `assets/css/site.css` | All styling (colours at the top) |
| `assets/js/site.js` | Menu, filters, search, newsletter |
| `assets/img/` | Web-sized photos (JPEG + WebP) |
| `assets/photos/` | Original full-size photos (not published) |
| `design/` | The original design exports, for reference only |

## Preview locally

You need [Node.js](https://nodejs.org) 18 or newer. In PowerShell, from this folder:

```powershell
npm start
```

Then open http://localhost:8080. Press Ctrl+C to stop. After you edit a file,
run `npm start` again (or `npm run build` in a second window) and refresh.

Opening the HTML files directly (double-clicking) mostly works, but search
needs the preview server.

## Add a publication

Open `data/publications.json` and copy an existing entry. Put the newest entry
at the top: the list shows in file order.

```json
{
  "id": "short-unique-name",
  "type": "Journal article",
  "pillars": ["Engineering"],
  "tag": "Engineering",
  "status": "Published",
  "status_group": "published",
  "year": 2026,
  "title": "Full title",
  "authors": "J. M. Mensah et al.",
  "venue": "Journal name, 2026 · doi.org/10.xxxx/xxxx",
  "url": "https://doi.org/10.xxxx/xxxx",
  "doi": "10.xxxx/xxxx",
  "abstract": "Optional. If filled in, a 'View abstract' toggle appears."
}
```

- `type`: `Journal article`, `Conference paper`, `Manuscript` or `Applied research`
- `pillars` (used by the filters): any of `Engineering`, `IT`, `Sustainability`
- `tag`: the orange label shown on the entry (free text, e.g. `IT · Security`)
- `status_group`: `published` (published or accepted) or `in-progress`
- `url` and `doi` are optional. Filter counts update automatically.

Watch the commas: every entry except the last needs a `,` after its closing `}`.
If you make a mistake, `npm run build` stops and tells you which file is wrong.

## Add a project

Open `data/projects.json` and copy an entry:

```json
{
  "id": "short-unique-name",
  "pillar": "Engineering",
  "status": "Ongoing",
  "title": "Project title",
  "partner": "Funder or partner line",
  "summary": "One or two sentences.",
  "period": "Team experience · 2026",
  "image": "",
  "alt": "",
  "placeholder": "Short description of the photo you'll add later"
}
```

- `pillar`: `Engineering`, `Information Technology` or `Sustainability`
- To also show it on the Home page, add a `home` block (see the existing ones);
  `order` sets its position there.
- Only one project should have a `featured` block (the large card at the top).

## Swap a placeholder for a real photo

Every photo slot is a single path. Leave it empty (`""`) to show the grey
labelled placeholder; fill it in to show the photo.

1. Put the photo in `assets/img/` (JPEG, about 1200–1600 px wide, under ~300 KB).
   If you also have a `.webp` with the same name, it is used automatically.
2. Set the path and describe the photo in `alt` (what a blind reader should hear):

| Slot | Where to set it |
|---|---|
| Project cards (Onaa, Trans-Sahara, HANEP, rooftop PV, biomethanation, smishing, Smart Campus, tenders) | `data/projects.json` → `image` + `alt` (Home card can override with `home.image` / `home.alt`) |
| Team portraits | `data/team.json` → `portrait` (e.g. `assets/img/joseph.jpg`), portrait shape 5:6 |
| About page team photo | `site.config.json` → `aboutTeamPhoto` + `aboutTeamPhotoAlt` (4:3). While empty, an animated EnJEL logo shows there instead (built in `build.js`, styled in `site.css` under "Animated logo"). |
| Partner logos | `data/partners.json` → `logo` (PNG or SVG, in `assets/img/logos/`); optional `caption` shows text under the logo |
| Home hero and Solutions photos | `src/pages/index.html` / `src/pages/solutions.html`, in the `{{> img …}}` lines |

Photos are cropped to fit their box, so keep the subject near the centre.

The Ghana GOALS photo is EnJEL's own. The other project photos are free
Pexels stock images of African settings (Ghana, Kenya, Nigeria), used as
illustrations until real project photos are available: swap them the same way.

Partner logos come from each organisation's official source (KNUST and SEED
Centre websites, Wikimedia Commons for DTU, EPRA and Innovate UK). DTU Skylab
has no logo of its own, so it uses the DTU logo with "Skylab" beside it, as
its own website does. For Horizon Europe the EU asks funded projects to show
the official "Funded by the European Union" emblem (from the European
Commission's download centre) rather than a programme logo.

## Newsletter sign-up form

GitHub Pages can't receive form submissions, so the footer form posts to
[Formspree](https://formspree.io) (free tier is fine).

The form is **EnJEL newsletter** in the Formspree account (form ID `mvkkrbyd`).
Sign-ups are emailed to the address set on that form in Formspree, and are
listed under the form's **Submissions** tab. The address is set in
`site.config.json`:

```json
"newsletterEndpoint": "https://formspree.io/f/mvkkrbyd"
```

If it's ever set back to `YOUR_FORM_ID`, the form tells visitors to email
info@enjel.org instead.

## Publish

Pushing to the `main` branch on GitHub runs `.github/workflows/pages.yml`,
which builds the site and deploys it. Progress shows under the repository's
**Actions** tab; the live address shows under **Settings → Pages**.

One-time setup (already done if the site is live): in the repository on GitHub,
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Custom domain (enjel.org)

The site lives at **https://enjel.org**. The domain is registered at
**Porkbun**, and DNS is managed there.

- GitHub: repo **Settings → Pages → Custom domain** is `enjel.org`, with
  **Enforce HTTPS** on. The certificate renews automatically. With GitHub
  Actions publishing, no `CNAME` file is needed; this setting is what counts.
- Porkbun DNS records for the website (don't delete these):
  - four `A` records on the root: `185.199.108.153`, `185.199.109.153`,
    `185.199.110.153`, `185.199.111.153`
  - `CNAME` on `www` → `mrcupid75.github.io`
  - `TXT` on `_github-pages-challenge-MrCupid75` (GitHub domain verification)
- `www.enjel.org`, `http://` and the old `mrcupid75.github.io/enjel-website/`
  address all redirect to `https://enjel.org`.
- Email (Zoho) uses separate `MX`/`TXT` records and doesn't conflict with
  the ones above.
- Renew the domain at Porkbun each year (turn on auto-renew).

## Contact details

Email, phone and office address in the footer come from `site.config.json`
(`email`, `phone`, `phoneIntl` for the tap-to-call link, `address`). Change
them there and every page updates.

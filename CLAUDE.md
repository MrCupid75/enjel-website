# EnJEL website: build brief for Claude Code

EnJEL is a research, engineering and development firm in Ghana (engineering, IT, sustainability).
Build its public website from the designs in `design/` and host it on GitHub Pages.

## Source material
- `design/*.dc.html`: one file per page, exported from the design canvas. Treat them as the
  visual and content reference. They are NOT runnable as-is: they use a design-tool runtime
  (`support.js`, `<x-dc>`, `<helmet>`, a `<script type="text/x-dc">` block) and `{{accent}}`
  template holes. Rebuild them as clean HTML/CSS; copy the text content exactly.
  - Main.dc.html → Home (`index.html`)
  - About.dc.html → About
  - Research.dc.html → Research & Publications
  - Projects.dc.html → Projects
  - Support.dc.html → Research Support
  - Solutions.dc.html → Solutions
- `assets/photos/`: free Pexels stock photos (Pexels licence, commercial use OK, no credit required).
  The designs reference them by asset URL; map them like this:
  - `/_blob/41ffc6b4973525a06191ae506a554e9f` → hero-solar-team.jpg (Home hero)
  - `/_blob/0df00a19d46c11d88c8832c0b922c779` → cloud-servers.jpg (Home, cloud card)
  - `/_blob/04492756f6ae42384674c1ea14e414d2` → cloud-fibre.jpg (Projects, cloud card)
  - `/_blob/6bb8238b648a19a4b3ffce93273fdc77` → gallery-solar.jpg
  - `/_blob/5cb7b1920f8abb6b38c49c0dcd1deca7` → gallery-lab.jpg
  - `/_blob/16e3411903cecbe1051d32671e046bc4` → gallery-community.jpg
  - `/_blob/7611fd564d161d4c937110f61d6b1b85` → gallery-conference.jpg
  - `/_blob/0fa1507ef6bae45a50d6c2eb30e990dc` → solutions-process-plant.jpg
  - `/_blob/bfb55cec62cc4fec2bd7d701b420095d` → solutions-data-centre.jpg
  - `/_blob/286604350bdebece74c74a3f78e192ff` → solutions-stakeholders.jpg
  Resize/compress to web sizes (WebP + JPEG fallback is fine) and add `loading="lazy"` below the fold.

## Look
- Fonts (Google Fonts): Source Serif 4 (headings, 600) and IBM Plex Sans (body, 400/500/600).
- Accent: #C2410C. Link/label orange: #9a3412. Text #1f1f1f, secondary #444444 / #555555.
  Borders #e3e3e3, soft panels #f7f5f2, placeholder fill #e9e5df, dark utility bar #1f1f1f.
- Content width max 1280px, 32px side padding, 4px corner radius. Must work well on phones
  (menus stack/collapse, grids reflow).

## Placeholders to KEEP (real photos come later)
Keep a labelled grey placeholder box, same aspect ratio, for:
- Project cards: Onaa / Ghana GOALS mini-grid, Trans-Sahara Living Labs, Yeboahkrom mini-grid,
  HANEP, Rooftop solar PV, Biomethanation, Mobile-money smishing detector, Smart Campus Guide,
  Tender and bid support.
- Team portraits (Joseph Mawulorm Mensah, Ephraim Abotsi) and the About team photo.
- Partner logos (KNUST, SEED Centre, DTU Skylab, EPRA Kenya, Innovate UK, Horizon Europe).
- Gallery captions stay as their [Caption: …] text until real captions are supplied.
Make swapping easy: one image path per slot, documented in README.

## Structure
- Plain static site (HTML + CSS + a little vanilla JS), or a simple static generator if it keeps
  things easier to edit. No server code.
- Put publications and projects in data files (e.g. `_data/publications.json`, `projects.json`)
  so adding one is a single small edit; render them into the pages.
- Site search and publication search: client-side only.
- Newsletter/contact forms: GitHub Pages can't receive submissions. Wire them to a form service
  placeholder (e.g. Formspree) with the endpoint left as a clearly marked TODO.
- Accessible: real links/buttons/labels, alt text on every image, 4.5:1 text contrast.

## Hosting
- Create a git repo, commit, and publish with GitHub Pages using a GitHub Actions workflow
  that deploys on every push to `main`.
- Ask me before creating the GitHub repo and before each push. I will sign in to GitHub myself.
- Leave a `CNAME` step documented (not created) for a custom domain later.
- Write a short README: how to preview locally, how to add a publication/project, how to swap
  a placeholder for a real photo, how to connect a custom domain.

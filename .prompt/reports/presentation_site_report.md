**Repository Analysis Summary**

- Source of truth used: [README.md](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/README.md)
- Supporting repo context also checked from:
  - [EcoCare-UI/README.md](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-UI/README.md)
  - [EcoCare-BE/README.md](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/EcoCare-BE/README.md)
  - [Dataset/POSTGRES_MAPPING.md](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/Dataset/POSTGRES_MAPPING.md)
- Confirmed monorepo facts reflected in the presentation:
  - Frontend uses React 19, TypeScript, Vite 6, Tailwind 4, React Router 7, PrimeReact, and Leaflet
  - Backend uses FastAPI, SQLAlchemy 2, Pydantic v2, and PostgreSQL
  - Dataset contains processed data, raw data, and ML artifacts
  - `n8n_workflow/` contains exported workflows for upstream data collection and sync
  - Full local stack starts with `docker compose up --build -d`
  - Backend exposes health/docs/bootstrap endpoints
  - Processed data can be seeded into PostgreSQL

**Standalone Site Location**

- Created as a root-level standalone static site at [pitch-site](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/pitch-site)

**Files Created**

- [index.html](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/pitch-site/index.html)
- [styles.css](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/pitch-site/styles.css)
- [script.js](/Users/nausicaa/Documents/GitHub/lotushack-trinova-team/pitch-site/script.js)

**What Was Not Modified**

- No existing frontend application files were changed
- No existing backend files were changed
- No build setup, router setup, Docker flow, or deployment config was modified

**Presentation Structure**

- Hero / Cover
- Team
- Problem
- Solution
- Full-Stack Architecture
- AI / Intelligence Layer
- Functionality / Reliability
- Innovation
- Impact / Relevance
- Demo / System Evidence
- Roadmap
- Final Thank You

**Assumptions Made**

- The presentation is intended for standalone static hosting later, so it was built as plain HTML/CSS/JS with no build system.
- The team label on the cover is presented as `Trinova Team` based on the repository name `lotushack-trinova-team`.
- Because no repository-supported team photos were found, the team slide uses polished placeholder portrait cards.
- Because no dedicated screenshot asset set was found for a self-contained static deck, demo and architecture visuals were implemented as designed HTML/CSS mock frames and diagram blocks instead of external images.

**How Content Maps To Judging Criteria**

- Technical Implementation & Complexity:
  - Full-stack architecture slide
  - AI / intelligence layer slide
  - Functionality / reliability slide
  - Demo / system evidence slide
- Innovation:
  - Route-aware search
  - AI-assisted ranking and slot logic
  - Ecosystem-driven platform positioning
  - n8n-to-dataset-to-API pipeline story
- Functionality & Reliability:
  - End-to-end owner/provider/operator flows
  - Docker startup proof
  - Health/docs/bootstrap endpoint evidence
  - PostgreSQL seeding and artifact-backed serving references
- Design & UX:
  - Full-screen slide treatment
  - Alternating dark/light presentation rhythm
  - Strong typography, motion, and section hierarchy
- Presentation:
  - Story organized for a 3-minute judging pitch
  - Concise copy with strong proof-oriented sections
- Impact & Relevance:
  - Owner, provider, and operator value are called out clearly
  - Sustainable EV/hybrid service ecosystem framing is preserved

**Placeholders Used**

- Team portraits are CSS-generated premium placeholder cards
- Demo interface visuals are stylized UI mock frames
- Architecture visuals are HTML/CSS diagram blocks
- No unsupported performance or business metrics were invented; proof blocks rely on real repository structure and documented commands/endpoints

**Basic Verification**

- Confirmed `pitch-site/index.html`, `pitch-site/styles.css`, and `pitch-site/script.js` exist
- Confirmed the standalone page contains 12 slide sections
- Confirmed all internal anchor links map to valid section ids

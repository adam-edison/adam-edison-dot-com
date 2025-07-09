- ✅ Content Fixes
  - ✅ Present job "is Funky Goblin Software", not Trust and Will - that ended June 2025
  - ✅ Centering on Contact page looks bad — make it left-aligned
  - ✅ Header on contact page is too big and overshadows the rest of the content

- Contact Form Improvements
  - Use only one email address field
  - Improve validation for email on frontend

- Captcha Improvements
  - Add fallback captcha for when the main one gets denied [see guide](./IMPROVE_CAPTCHA.md)

- Landing Page Load Jank Removal
  - Use image dimensions to prevent layout shift
  - Preload main avatar image

- Refactoring
  - Logger (log)
  - DI classes for all API stuff
  - Remove outdated comments
  - Extract lots of hardcoded variables as env values
  - Encapsulate all boundaries
  - Organize tests better (all in separate root tests folder next to src)
  - Make top-level error handler reused across API endpoints

- Add Claude Learnings
  - Prefer this style of working with DI and factories
  - Prefer this kind of folder structure for Next js projects
  - Prefer this type of testing strategy

- SEO
  - Add some basic SEO using [this guide](./SearchEngineOptimization.md)

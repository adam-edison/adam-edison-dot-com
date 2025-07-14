- ✅ Content Fixes
  - ✅ Present job "is Funky Goblin Software", not Trust and Will - that ended June 2025
  - ✅ Centering on Contact page looks bad — make it left-aligned
  - ✅ Header on contact page is too big and overshadows the rest of the content

- ✅ Contact Form Improvements
  - ✅ Use only one email address field
  - ✅ Improve validation for email on frontend

- ✅ Add favicon (avatar logo)

- ✅ Landing Page Load Jank Removal
  - ✅ Use image dimensions to prevent layout shift
  - ✅ Preload main avatar image

- 🚧 Refactoring
  - ✅ Logger (log)
  - ✅ DI classes for all API stuff
  - ✅ Encapsulate all boundaries
  - ✅ Externalize email templates
  - ✅ Make all imports absolute references (no ../)
  - ✅ Organize files and tests better (all in separate root tests folder next to src)
  - ✅ Remove outdated comments and unnecessary comments
  - ✅ Make InMemoryLogger and Logger have a unified interface
  - 🚧 Extract lots of hardcoded variables as env values
  - Fix the dotenv logging out warnings during tests
  - Get rid of unnecessary nesting and simplify code logic
  - Make top-level error handler reused across API endpoints if possible, and simplify error handling

- Captcha Improvements
  - Fix unconditional skipping of recaptcha, might as well not be there
  - Add fallback captcha for when the main one gets denied [see guide](./IMPROVE_CAPTCHA.md) - maybe just use v2 instead?

- Add Claude Learnings
  - Prefer this style of working with DI and factories
  - Prefer this kind of folder structure for Next js projects
  - Prefer this type of testing strategy

- SEO
  - Add some basic SEO using [this guide](./SearchEngineOptimization.md)

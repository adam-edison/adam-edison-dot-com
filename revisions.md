* Refactoring

  * Logger (log)
  * DI classes for all API stuff
  * Remove outdated comments
  * Extract lots of hardcoded variables as env values
  * Encapsulate all boundaries
  * Organize tests better (all in separate root tests folder next to src)
  * Make top-level error handler reused across API endpoints

* Content Fixes
  * Present job "is Funky Goblin Software", not Trust and Will - that ended June 2025
  * Centering on Contact page looks bad — make it left-aligned
  * Header on contact page is too big and overshadows the rest of the content

* SEO
  * Add some basic SEO using [this guide](./SearchEngineOptimization.md)

* Captcha Improvements
  * Add fallback captcha for when the main one gets denied [see guide](./IMPROVE_CAPTCHA.md)


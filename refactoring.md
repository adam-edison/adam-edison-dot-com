You're right — this could definitely be made cleaner and more maintainable. The code isn’t bad, but it _is_ bulky, repetitive, and hard to scan quickly, especially for a backend developer used to logic-driven structure.

### ✅ Goals for Improvement

To make this code cleaner:

1. **Reduce duplication**
2. **Extract semantic components**
3. **Encapsulate config/constants**
4. **Improve visual hierarchy**
5. **Organize for scalability**

---

## 🔧 Suggestions for Cleaning It Up

---

### 1. **Extract Social Link as a Component**

The two `<a>` blocks for GitHub and LinkedIn are nearly identical.

```tsx
// components/SocialIconLink.tsx
export function SocialIconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-400 hover:text-white transition-colors"
      aria-label={label}
    >
      {children}
    </a>
  );
}
```

Then your `Home` component becomes:

```tsx
<SocialIconLink href={githubUrl} label="GitHub">
  <GitHubIcon />
</SocialIconLink>
<SocialIconLink href={linkedInUrl} label="LinkedIn">
  <LinkedInIcon />
</SocialIconLink>
```

You can also extract `GitHubIcon` and `LinkedInIcon` separately if you want.

---

### 2. **Extract Navigation Links into a `NavLink` Component**

Instead of repeating `Link` blocks:

```tsx
// components/NavLink.tsx
import Link from 'next/link';

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-300 hover:text-white transition-colors">
      {children}
    </Link>
  );
}
```

Now usage is cleaner:

```tsx
<NavLink href="/about">About Me</NavLink>
<NavLink href="/resume">Resume</NavLink>
<NavLink href="/contact">Contact</NavLink>
```

---

### 3. **Extract Header, Hero, and Banner into Components**

For readability and separation of concern, extract key layout sections:

```tsx
// components/HeaderBanner.tsx
export function HeaderBanner() {
  return (
    <div className="bg-gray-900 px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <span className="text-gray-300 text-sm">
          Currently available for small contract and part-time roles as a senior full-stack software engineer!
        </span>
      </div>
    </div>
  );
}
```

Same can be done for:

- `HeroSection`
- `MainHeader` (that wraps `<h1>` and `<nav>`)

---

### 4. **Group Constants**

Move your URLs into a constants file or just outside the component:

```tsx
const SOCIAL_LINKS = {
  github: 'https://github.com/adam-edison',
  linkedin: 'https://www.linkedin.com/in/adam-edison-software/'
};
```

Then refer via: `SOCIAL_LINKS.github`

---

### 5. **Use Better File Layout**

```
components/
  HeaderBanner.tsx
  SocialIconLink.tsx
  NavLink.tsx
  HeroSection.tsx
  MainHeader.tsx
pages/
  index.tsx
public/
  undraw_developer-activity_4zqd.svg
```

---

### 6. **Typography/Font Management**

Instead of injecting the font in `className`, you can inject it into a layout or global style layer. This way your pages don't have to deal with it.

Or use a Tailwind config like:

```ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-geist-sans)', 'sans-serif'],
    }
  }
}
```

Then your page is cleaner: `className="font-sans"`.

---

### 🧼 Final Result: Cleaner `Home.tsx`

```tsx
import { HeaderBanner } from '@/components/HeaderBanner';
import { MainHeader } from '@/components/MainHeader';
import { HeroSection } from '@/components/HeroSection';
import { Geist } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

export default function Home() {
  return (
    <div className={`${geistSans.className} min-h-screen bg-black text-white`}>
      <HeaderBanner />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <MainHeader />
        <HeroSection />
      </div>
    </div>
  );
}
```

---

## ✅ Summary: Best Next Steps

| Step | Action                                                                    |
| ---- | ------------------------------------------------------------------------- |
| 🔁 1 | Extract social links & nav links into reusable components                 |
| 🧩 2 | Break the page into sections: `HeaderBanner`, `MainHeader`, `HeroSection` |
| 📁 3 | Move constants (URLs, labels) out of component body                       |
| 🧼 4 | Consider Tailwind `theme.extend` to handle fonts globally                 |
| 🧱 5 | Add a layout or consistent shell if you grow the app                      |

Let me know if you want me to generate these files/components directly — I can scaffold everything cleanly in a few seconds.

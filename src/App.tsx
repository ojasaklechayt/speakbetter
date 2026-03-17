import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'

const docsLinks = [
  {
    href: 'https://vite.dev/',
    label: 'Explore Vite',
    icon: <img className="h-[18px]" src={viteLogo} alt="" />,
  },
  {
    href: 'https://react.dev/',
    label: 'Learn more',
    icon: <img className="h-[18px] w-[18px]" src={reactLogo} alt="" />,
  },
]

const socialLinks = [
  { href: 'https://github.com/vitejs/vite', label: 'GitHub', iconId: 'github-icon' },
  { href: 'https://chat.vite.dev/', label: 'Discord', iconId: 'discord-icon' },
  { href: 'https://x.com/vite_js', label: 'X.com', iconId: 'x-icon' },
  { href: 'https://bsky.app/profile/vite.dev', label: 'Bluesky', iconId: 'bluesky-icon' },
]

function TickDivider() {
  return (
    <div className="relative w-full before:absolute before:top-[-4.5px] before:left-0 before:border-[5px] before:border-transparent before:border-l-[var(--border)] before:content-[''] after:absolute after:top-[-4.5px] after:right-0 after:border-[5px] after:border-transparent after:border-r-[var(--border)] after:content-['']" />
  )
}

function LinkPill({
  href,
  label,
  icon,
  invertInDark = false,
}: {
  href: string
  label: string
  icon: React.ReactNode
  invertInDark?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--social-bg)] px-3 py-1.5 text-base text-[var(--text-h)] no-underline transition-shadow hover:shadow-[var(--shadow)] md:w-auto"
    >
      <span className={invertInDark ? 'dark:invert dark:brightness-200' : ''}>
        {icon}
      </span>
      {label}
    </a>
  )
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section className="flex grow flex-col place-items-center place-content-center gap-[18px] px-5 pt-8 pb-6 text-center lg:gap-[25px] lg:px-0 lg:py-0">
        <div className="relative">
          <img
            src={heroImg}
            className="relative z-0 w-[170px]"
            width="170"
            height="179"
            alt=""
          />
          <img
            src={reactLogo}
            className="absolute inset-x-0 top-[34px] z-10 mx-auto h-7 [transform:perspective(2000px)_rotateZ(300deg)_rotateX(44deg)_rotateY(39deg)_scale(1.4)]"
            alt="React logo"
          />
          <img
            src={viteLogo}
            className="absolute inset-x-0 top-[107px] z-0 mx-auto h-[26px] w-auto [transform:perspective(2000px)_rotateZ(300deg)_rotateX(40deg)_rotateY(39deg)_scale(0.8)]"
            alt="Vite logo"
          />
        </div>
        <div>
          <h1 className="my-5 text-4xl leading-none font-medium tracking-[-1.08px] text-[var(--text-h)] lg:my-8 lg:text-7xl lg:tracking-[-1.68px]">
            Get started
          </h1>
          <p>
            Edit{' '}
            <code className="inline-flex rounded bg-[var(--code-bg)] px-2 py-1 font-mono text-[15px] leading-[135%] text-[var(--text-h)]">
              src/App.tsx
            </code>{' '}
            and save to test{' '}
            <code className="inline-flex rounded bg-[var(--code-bg)] px-2 py-1 font-mono text-[15px] leading-[135%] text-[var(--text-h)]">
              HMR
            </code>
          </p>
        </div>
        <button
          className="mb-6 inline-flex rounded-[5px] border-2 border-transparent bg-[var(--accent-bg)] px-[10px] py-[5px] font-mono text-base text-[var(--accent)] transition-colors hover:border-[var(--accent-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <TickDivider />

      <section className="flex flex-col border-t border-[var(--border)] text-center lg:flex-row lg:text-left">
        <div className="flex-1 border-b border-[var(--border)] px-5 py-6 lg:border-r lg:border-b-0 lg:px-8 lg:py-8">
          <svg
            className="mb-4 inline-block h-[22px] w-[22px] lg:block"
            role="presentation"
            aria-hidden="true"
          >
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2 className="mb-2 text-[20px] leading-[118%] font-medium tracking-[-0.2px] text-[var(--text-h)] lg:text-2xl lg:tracking-[-0.24px]">
            Documentation
          </h2>
          <p>Your questions, answered</p>
          <ul className="mt-5 flex list-none flex-wrap justify-center gap-2 p-0 lg:mt-8 lg:justify-start">
            {docsLinks.map((link) => (
              <li key={link.href} className="flex-1 basis-[calc(50%-8px)] md:flex-none">
                <LinkPill {...link} />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <svg
            className="mb-4 inline-block h-[22px] w-[22px] lg:block"
            role="presentation"
            aria-hidden="true"
          >
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2 className="mb-2 text-[20px] leading-[118%] font-medium tracking-[-0.2px] text-[var(--text-h)] lg:text-2xl lg:tracking-[-0.24px]">
            Connect with us
          </h2>
          <p>Join the Vite community</p>
          <ul className="mt-5 flex list-none flex-wrap justify-center gap-2 p-0 lg:mt-8 lg:justify-start">
            {socialLinks.map((link) => (
              <li key={link.href} className="flex-1 basis-[calc(50%-8px)] md:flex-none">
                <LinkPill
                  href={link.href}
                  label={link.label}
                  invertInDark
                  icon={
                    <svg
                      className="h-[18px] w-[18px]"
                      role="presentation"
                      aria-hidden="true"
                    >
                      <use href={`/icons.svg#${link.iconId}`}></use>
                    </svg>
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TickDivider />
      <section className="h-12 border-t border-[var(--border)] lg:h-[88px]" />
    </>
  )
}

export default App

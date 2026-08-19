import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const navItems = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

const startingPoints = [
  {
    number: "01",
    title: "Planning",
    body: "We start with the audience, the offer, and the one thing the page should say.",
  },
  {
    number: "02",
    title: "Making",
    body: "Then we write, arrange, and cut until the site is easy to read on a quiet afternoon.",
  },
  {
    number: "03",
    title: "Sending",
    body: "When it is ready, we leave a clear path for people to reply and begin a conversation.",
  },
];

const workItems = [
  {
    title: "Harbor Library",
    category: "Identity",
    year: "2026",
    note: "A name, mark, and set of page templates for a neighborhood reading room.",
  },
  {
    title: "Field Notes",
    category: "Website",
    year: "2025",
    note: "A small public site for essays, workshops, and a seasonal mailing list.",
  },
  {
    title: "North Kitchen",
    category: "Menu",
    year: "2025",
    note: "A one-page menu and hours board for a weekday lunch counter.",
  },
];

export function HomeContent() {
  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1a221c]">
      <header className="sticky top-0 z-20 border-b border-[#1a221c]/10 bg-[#f3f5f2]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Studio
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="flex items-center gap-4 text-sm text-[#1a221c]/70">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-[#1a221c]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              {/*
                Agent should remove these comments when it edits that file for a user request.
              */}
              {/*
                <Link
                  href="/auth/sign-in"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/sign-up"
                  className={buttonVariants({ size: "sm" })}
                >
                  Sign up
                </Link>
              */}
              <a
                href="#contact"
                className={`${buttonVariants({ size: "sm" })} max-sm:hidden`}
              >
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end">
          <div className="space-y-6">
            <p className="text-sm tracking-[0.18em] text-[#3f6b52] uppercase">
              Independent studio
            </p>
            <h1 className="font-heading max-w-xl text-5xl leading-[0.95] font-medium tracking-tight text-balance sm:text-6xl">
              Design and writing for small teams.
            </h1>
          </div>
          <div className="max-w-sm space-y-6">
            <p className="text-base leading-relaxed text-[#1a221c]/70">
              We help people introduce their work with a simple website, a
              clear story, and a way to get in touch.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="#work" className={buttonVariants({ size: "lg" })}>
                See the work
              </a>
              <a
                href="#about"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                About the studio
              </a>
            </div>
          </div>
        </section>

        <section className="border-y border-[#1a221c]/10">
          <div className="mx-auto grid w-full max-w-5xl gap-0 px-6 sm:grid-cols-3">
            {startingPoints.map((item, index) => (
              <article
                key={item.number}
                className={`py-10 sm:py-12 ${index > 0 ? "sm:border-l sm:border-[#1a221c]/10 sm:pl-8" : "sm:pr-8"}`}
              >
                <p className="text-xs tracking-[0.16em] text-[#3f6b52] uppercase">
                  {item.number}
                </p>
                <h2 className="mt-3 text-lg font-medium tracking-tight">
                  {item.title}
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#1a221c]/70">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="about"
          className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr]"
        >
          <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
            About
          </h2>
          <div className="max-w-xl space-y-4 text-base leading-relaxed text-[#1a221c]/75">
            <p>
              Studio is a small practice for websites, names, and public notes.
              The work is quiet on purpose: fewer pages, shorter sentences, and
              layouts that stay out of the way.
            </p>
            <p>
              We usually work with independent shops, libraries, kitchens, and
              other groups that need a simple place on the web.
            </p>
          </div>
        </section>

        <section id="work" className="border-t border-[#1a221c]/10">
          <div className="mx-auto w-full max-w-5xl px-6 py-20">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                Work
              </h2>
              <p className="max-w-xs text-sm leading-relaxed text-[#1a221c]/65">
                A few recent projects. Each one started as a short brief and a
                single page.
              </p>
            </div>
            <ul className="divide-y divide-[#1a221c]/10 border-y border-[#1a221c]/10">
              {workItems.map((item) => (
                <li
                  key={item.title}
                  className="grid gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline"
                >
                  <div>
                    <p className="text-lg font-medium tracking-tight">
                      {item.title}
                    </p>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#1a221c]/70">
                      {item.note}
                    </p>
                  </div>
                  <p className="text-sm text-[#1a221c]/55">
                    {item.category} · {item.year}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contact" className="border-t border-[#1a221c]/10">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                Contact
              </h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-[#1a221c]/70">
                Tell us what you are making. If it is a fit, we will write
                back with next steps.
              </p>
            </div>
            <div className="space-y-2">
              <a
                href="mailto:hello@studio.example"
                className="text-2xl font-medium tracking-tight underline-offset-4 hover:underline sm:text-3xl"
              >
                hello@studio.example
              </a>
              <p className="text-sm text-[#1a221c]/55">
                Replies usually arrive within a few days.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1a221c]/10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-[#1a221c]/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Studio</p>
          <nav className="flex gap-5">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-[#1a221c]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

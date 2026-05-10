# AI Design Playbook

This template should help generated sites feel intentionally designed without turning every output into an animation demo.

## Defaults

- Start from the Base UI/shadcn components in `src/components/ui`.
- Use Magic UI for polished, production-ready flourishes that fit the shadcn workflow.
- Use `motion/react` for React animation primitives. Do not import from `framer-motion`.
- Use React Bits only as an optional external source when a prompt explicitly needs bold text effects, hero backgrounds, animated menus, or card interactions. Check its license before redistributing components as template code.
- Use `@iconify/react` when a site needs brand or niche icon sets that Lucide does not cover. Keep Lucide as the default product icon set.

## Taste Rules

- Choose one strong visual idea per page.
- Use at most one hero/background effect per page.
- Use at most two animated component-registry pieces above the fold.
- Do not build landing pages as stacks of floating cards. Use full-width sections, grids, editorial layouts, or dense product UI as appropriate.
- Do not nest cards inside cards unless the inner element is a repeated item, modal, or framed tool.
- Avoid default AI palettes: purple-blue gradients, beige monochrome, and dark slate everywhere.
- Avoid oversized rounded rectangles as the dominant visual language.
- Use motion to clarify hierarchy or state. Do not animate every component.
- Respect `prefers-reduced-motion` for every custom animation.

## Recommended Use

- Use `Reveal` and `Stagger` for page-load and scroll-entry motion.
- Use `TextReveal` for one headline or one short value proposition, not body copy.
- Use `SmoothScrollProvider` only for marketing/editorial pages where smooth scrolling materially improves the experience.
- Use Magic UI backgrounds behind hero or feature sections only when the content remains readable.
- Use Magic UI borders and cards for one highlighted surface, not every card on the page.

## Design Doctor

Run `pnpm design:doctor` before shipping generated UI changes. Treat warnings as design-review prompts, not as permission to delete files or disable checks.


#!/usr/bin/env node

import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const scanRoots = ["src/app", "src/components"]
const heavyAnimationImports = [
  "motion/react",
  "gsap",
  "@gsap/react",
  "animejs",
  "lenis",
  "reactbits",
]
const magicEffects = [
  "BorderBeam",
  "ShineBorder",
  "MagicCard",
  "Marquee",
  "GridPattern",
  "DotPattern",
  "TextAnimate",
  "BlurFade",
]

const issues = []

function addIssue(file, message) {
  issues.push({ file: path.relative(root, file), message })
}

function countMatches(text, pattern) {
  return text.match(pattern)?.length ?? 0
}

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name)

    if (entry.name === "node_modules" || entry.name === ".next") continue

    if (entry.isDirectory()) {
      await walk(absolutePath, files)
      continue
    }

    if (/\.(ts|tsx|css|md|mdx)$/.test(entry.name)) {
      files.push(absolutePath)
    }
  }

  return files
}

async function listFiles() {
  const files = []

  for (const scanRoot of scanRoots) {
    const absoluteRoot = path.join(root, scanRoot)
    if (!existsSync(absoluteRoot)) continue

    files.push(...await walk(absoluteRoot))
  }

  return files
}

for (const file of await listFiles()) {
  const text = await readFile(file, "utf8")
  const isUiLibraryFile = file.includes(`${path.sep}src${path.sep}components${path.sep}ui${path.sep}`)
  const isMotionLibraryFile = file.includes(`${path.sep}src${path.sep}components${path.sep}motion${path.sep}`)
  const isLibraryFile = isUiLibraryFile || isMotionLibraryFile
  const importCount = heavyAnimationImports.reduce(
    (total, token) => total + countMatches(text, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")),
    0
  )
  const magicEffectCount = magicEffects.reduce(
    (total, token) => total + countMatches(text, new RegExp(`\\b${token}\\b`, "g")),
    0
  )
  const purpleGradientCount = countMatches(
    text,
    /(purple|violet|fuchsia|indigo|#7c3aed|#8b5cf6|#a855f7|#6366f1|264\.376|linear-gradient\([^)]*(purple|violet|fuchsia|indigo))/gi
  )
  const roundedCardCount = countMatches(text, /rounded-(3xl|4xl|full).*?(bg-card|shadow|border)|(?:bg-card|shadow|border).*?rounded-(3xl|4xl|full)/g)
  const nestedCardHints = countMatches(text, /<Card(?:\s|>)[\s\S]{0,900}<Card(?:\s|>)/g)
  const reducedMotionMentioned = /prefers-reduced-motion|useReducedMotion|reducedMotion|shouldReduceMotion/.test(text)

  if (!isLibraryFile && importCount > 3) {
    addIssue(file, `uses ${importCount} animation-heavy imports; keep page-level motion focused`)
  }

  if (!isLibraryFile && magicEffectCount > 4) {
    addIssue(file, `uses ${magicEffectCount} animated/effect components; limit registry effects per page`)
  }

  if (!isLibraryFile && purpleGradientCount > 5) {
    addIssue(file, `leans heavily on purple/blue gradient tokens; choose a less generic palette`)
  }

  if (!isLibraryFile && roundedCardCount > 8) {
    addIssue(file, `has ${roundedCardCount} oversized rounded card-like surfaces; reduce generic card language`)
  }

  if (!isLibraryFile && nestedCardHints > 0) {
    addIssue(file, "appears to nest Card components; use sections or repeated items instead")
  }

  if (!isLibraryFile && importCount > 0 && !reducedMotionMentioned) {
    addIssue(file, "uses motion libraries without an obvious reduced-motion fallback")
  }
}

if (issues.length > 0) {
  console.error("Design doctor found issues:\n")

  for (const issue of issues) {
    console.error(`- ${issue.file}: ${issue.message}`)
  }

  process.exit(1)
}

console.log("Design doctor passed.")

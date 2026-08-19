import type { Metadata } from "next"

import { HomeContent } from "@/components/home-content"

export const metadata: Metadata = {
  title: "Studio",
  description: "A simple website to introduce your work.",
}

export default function Home() {
  return <HomeContent />
}

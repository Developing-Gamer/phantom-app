import type { Metadata } from "next"

import { HomeContent } from "@/components/home-content"

export const metadata: Metadata = {
  title: "Hello World",
  description: "A simple website template.",
}

export default function Home() {
  return <HomeContent />
}

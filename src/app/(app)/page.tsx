import type { Metadata } from "next"

import { HomeContent } from "@/components/home-content"
import { RootProviders } from "@/components/root-providers"

export const metadata: Metadata = {
  title: "Dashboard | Phantom App",
  description: "Authenticated Phantom app dashboard with Stack Auth and InstantDB.",
}

export default function Home() {
  return (
    <RootProviders>
      <HomeContent />
    </RootProviders>
  )
}

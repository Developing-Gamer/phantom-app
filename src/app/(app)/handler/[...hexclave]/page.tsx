import { HexclaveHandler } from "@hexclave/next";

export const metadata = {
  title: "Authentication | Phantom App",
  description: "Hexclave auth handler for Phantom App.",
};

export default function Handler() {
  return <HexclaveHandler fullPage />;
}

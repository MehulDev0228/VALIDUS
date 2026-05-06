import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Private alpha · FutureValidate",
  description: "Request access to the founder operating environment for decisions on the record.",
}

export default function AlphaLayout({ children }: { children: React.ReactNode }) {
  return children
}

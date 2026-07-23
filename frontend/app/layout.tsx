import type { Metadata } from "next"
import { Providers } from "@/components/providers"
import { DemoProvider } from "@/components/providers/demo-provider"
import { MainLayout } from "@/components/layout/main-layout"
import { CommandCenter } from "@/components/layout/command-center"
import { AiCommandPalette } from "@/components/copilot/ai-command-palette"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sanchar AI OS",
  description: "Enterprise logistics route optimization and operations command platform.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans antialiased">
        <Providers>
          <DemoProvider>
            <MainLayout>
              {children}
            </MainLayout>
            <CommandCenter />
            <AiCommandPalette />
          </DemoProvider>
        </Providers>
      </body>
    </html>
  )
}

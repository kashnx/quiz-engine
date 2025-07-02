
import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
    title: "Quiz App",
    description: "AI-Powered Quiz Generator",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <SidebarProvider>
                            <AppSidebar />
                            <main className={"relative w-full overflow-hidden"}>
                                <SidebarTrigger />
                                {children}
                                <Toaster
                                    position="top-right"
                                    toastOptions={{
                                        duration: 4000,
                                        style: {
                                            background: "hsl(var(--popover))",
                                            color: "hsl(var(--popover-foreground))",
                                            border: "1px solid hsl(var(--border))"
                                        },
                                        success: {
                                            duration: 3000,
                                            iconTheme: {
                                                primary: "#4ade80",
                                                secondary: "hsl(var(--primary-foreground))",
                                            },
                                        },
                                        error: {
                                            duration: 4000,
                                            iconTheme: {
                                                primary: "#ef4444",
                                                secondary: "hsl(var(--primary-foreground))",
                                            },
                                        },
                                    }}
                                />
                            </main>
                        </SidebarProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}

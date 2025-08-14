import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TanstackQueryProvider } from "@/components/providers/tanstack-query-provider";
import { dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loja Íntima",
  description: "O melhor da moda íntima.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();
  const dehydratedState = dehydrate(queryClient);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.class}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TanstackQueryProvider dehydratedState={dehydratedState}>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 container mx-auto py-4 md:py-6">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className: "text-sm font-medium",
            duration: 3000,
            style: { borderRadius: "12px", padding: "12px 16px" },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}

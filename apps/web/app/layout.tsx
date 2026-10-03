import type { ReactNode } from "react";
import "./globals.css";
import "./theme.css";
import "./accessibility.css";
import { AppShell } from "../components/app-shell";
import { InstallPrompt } from "../components/install-prompt";

export const metadata = {
  title: "BudgetMap",
  description: "Quản lý ngân sách cá nhân nhẹ nhàng và rõ ràng.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "BudgetMap",
    statusBarStyle: "black-translucent" as const,
  },
  icons: {
    icon: "/brand/app-icon-pastel-no-white-border.png?v=5",
    apple: "/brand/app-icon-pastel-no-white-border.png?v=5",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
  themeColor: "#1b1730",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <title>BudgetMap</title>
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const saved=localStorage.getItem('budgetmap-theme');const theme=saved==='dark'||saved==='light'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme}catch{document.documentElement.dataset.theme='light'}})()`,
          }}
        />
        <AppShell>{children}</AppShell>
        <InstallPrompt />
      </body>
    </html>
  );
}

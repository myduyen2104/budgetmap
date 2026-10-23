import type { ReactNode } from "react";
import "./globals.css";
import "./theme.css";
import "./accessibility.css";
import "./responsive.css";
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
            __html: `(()=>{try{const root=document.documentElement;const saved=localStorage.getItem('budgetmap-theme');const theme=saved==='dark'||saved==='light'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');root.dataset.theme=theme;const palettes={orange:['#e6a47f','#cf8a65','#fff3ec','#f3d8c9'],yellow:['#f2d477','#d9b332','#fff8e3','#efdfa9'],brown:['#b99a82','#6f4e37','#f7f1eb','#e8d9cc'],blue:['#82aee0','#6f9fd6','#eef5ff','#d3e3f8'],cyan:['#82cfe0','#519eb2','#effafd','#d2edf2'],red:['#df6268','#bf3f4b','#fff0f0','#f0c5c7'],burgundy:['#800020','#600018','#f8edf0','#e6cbd2'],pink:['#df8fb4','#c9789f','#fff0f6','#f2d3e1'],green:['#82b98f','#64a976','#eff8f0','#d2e7d7']};const id=localStorage.getItem('budgetmap-theme-color');const values=palettes[id]||['#806fe5','#5b4bb7','#eee9ff','#ddd5ff'];const dark=theme==='dark';const primary=id==='burgundy'&&dark?'#6f102b':values[0];const strong=id==='burgundy'&&dark?'#941f40':values[1];root.dataset.themeColor=palettes[id]?id:'';[['--theme-primary',primary],['--theme-primary-strong',strong],['--theme-primary-soft',dark?'#262b31':values[2]],['--theme-border',dark?'#3b424a':values[3]],['--theme-page-bg',dark?'#111315':values[2]],['--theme-bg',dark?'#111315':values[2]],['--theme-surface',dark?'#1a1d21':'#ffffff'],['--theme-surface-muted',dark?'#23272c':values[2]],['--theme-surface-2',dark?'#23272c':'#ffffff'],['--theme-line',dark?'#3b424a':values[3]],['--brand',primary],['--brand-strong',strong],['--brand-soft',dark?'#262b31':values[2]],['--brand-border',dark?'#3b424a':values[3]]].forEach(([name,value])=>root.style.setProperty(name,value))}catch{document.documentElement.dataset.theme='light'}})()`,
          }}
        />
        <AppShell>{children}</AppShell>
        <InstallPrompt />
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import "./theme.css";
import "./accessibility.css";
import "./responsive.css";
import { AppShell } from "../components/app-shell";
import { InstallPrompt } from "../components/install-prompt";
import { THEME_PALETTES } from "../lib/theme";

const paletteMap = Object.fromEntries(THEME_PALETTES.map(({ id, vars }) => [id, vars]));
const themeInitScript = `(()=>{try{const root=document.documentElement;const savedTheme=localStorage.getItem('budgetmap-theme');const theme=savedTheme==='dark'||savedTheme==='light'?savedTheme:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');root.dataset.theme=theme;const palettes=${JSON.stringify(paletteMap)};const savedPalette=localStorage.getItem('budgetmap-theme-color');if(savedPalette!==null&&!Object.prototype.hasOwnProperty.call(palettes,savedPalette)){root.dataset.themeColor='';return}const id=savedPalette??'purple';const [primary,strong,soft,line]=palettes[id];const dark=theme==='dark';const activePrimary=dark&&id==='burgundy'?'#6f102b':primary;const activeStrong=dark&&id==='burgundy'?'#941f40':strong;root.dataset.themeColor=id;const set=(name,value)=>root.style.setProperty(name,value);set('--theme-primary',dark?activePrimary:primary);set('--theme-primary-strong',dark?activeStrong:strong);set('--theme-primary-soft',dark?'#262b31':soft);set('--theme-border',dark?'#3b424a':line);set('--theme-page-bg',dark?'#111315':'color-mix(in srgb, '+soft+' 28%, #fbfaff)');set('--theme-bg',dark?'#111315':'color-mix(in srgb, '+soft+' 28%, #fbfaff)');set('--theme-surface',dark?'#1a1d21':'color-mix(in srgb, '+soft+' 10%, #ffffff)');set('--theme-surface-2',dark?'#23272c':'color-mix(in srgb, '+soft+' 42%, #ffffff)');set('--theme-surface-muted',dark?'#23272c':'color-mix(in srgb, '+soft+' 42%, #ffffff)');set('--theme-line',dark?'#3b424a':'color-mix(in srgb, '+line+' 76%, #ffffff)');set('--theme-shadow','0 10px 30px color-mix(in srgb, '+(dark?activeStrong:strong)+' 20%, transparent)');set('--purple',dark?activePrimary:primary);set('--purple-strong',dark?activeStrong:strong);set('--purple-soft',dark?'#262b31':soft);set('--purple-line',dark?'#3b424a':line);set('--purple-border',dark?'#3b424a':line);set('--brand',dark?activePrimary:primary);set('--brand-strong',dark?activeStrong:strong);set('--brand-soft',dark?'#262b31':soft);set('--brand-border',dark?'#3b424a':line);set('--brand-gradient','linear-gradient(135deg, '+(dark?activePrimary:primary)+' 0%, '+(dark?activeStrong:strong)+' 100%)')}catch{document.documentElement.dataset.theme='light'}})()`;

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
        <link rel="preload" href="/fonts/GoogleSansFlex-Variable.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      </head>
      <body>
        <Script id="budgetmap-theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
        <AppShell>{children}</AppShell>
        <InstallPrompt />
      </body>
    </html>
  );
}

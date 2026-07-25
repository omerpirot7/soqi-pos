import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, isRtl, type Locale } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import "../globals.css";

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: "variable",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

const noto = Noto_Sans({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سۆقی | POS",
  description: "Point of Sale & Management System",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolved = await Promise.resolve(params);
  const locale = resolved.locale as Locale;
  if (!routing.locales.includes(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={locale === "ckb" ? notoArabic.className : noto.className}>
        <Script id="soqi-accent-boot" strategy="beforeInteractive">{`
          (function(){try{var c=localStorage.getItem('soqi-accent-color');if(!c)return;var h=c.replace('#','');if(h.length===3)h=h.split('').map(function(x){return x+x}).join('');var n=parseInt(h,16);if(!isFinite(n))return;var r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255;var max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,s=0,hh=0;if(max!==min){var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:hh=((g-b)/d+(g<b?6:0))/6;break;case g:hh=((b-r)/d+2)/6;break;default:hh=((r-g)/d+4)/6}}hh=Math.round(hh*360);s=Math.round(s*100);l=Math.round(l*100);var dark=document.documentElement.classList.contains('dark');var pl=dark?Math.min(Math.max(l,42),55):Math.min(Math.max(l,22),40);var root=document.documentElement;function set(k,v){root.style.setProperty(k,v)}set('--primary',hh+' '+s+'% '+pl+'%');set('--ring',hh+' '+s+'% '+pl+'%');if(dark){set('--background',hh+' 20% 8%');set('--foreground',hh+' 15% 95%');set('--card',hh+' 18% 11%');set('--card-foreground',hh+' 15% 95%');set('--popover',hh+' 18% 11%');set('--popover-foreground',hh+' 15% 95%');set('--secondary',hh+' 14% 18%');set('--secondary-foreground',hh+' 15% 95%');set('--muted',hh+' 12% 16%');set('--muted-foreground',hh+' 10% 65%');set('--accent',hh+' 25% 18%');set('--accent-foreground',hh+' 50% 70%');set('--border',hh+' 12% 20%');set('--input',hh+' 12% 20%')}else{set('--background',hh+' 20% 98%');set('--foreground',hh+' 30% 10%');set('--card',hh+' 35% 99%');set('--card-foreground',hh+' 30% 10%');set('--popover',hh+' 35% 99%');set('--popover-foreground',hh+' 30% 10%');set('--secondary',hh+' 14% 92%');set('--secondary-foreground',hh+' 30% 15%');set('--muted',hh+' 10% 94%');set('--muted-foreground',hh+' 8% 40%');set('--accent',hh+' 30% 92%');set('--accent-foreground',hh+' '+s+'% '+Math.max(pl-6,18)+'%');set('--border',hh+' 12% 88%');set('--input',hh+' 12% 88%')}}catch(e){}})();
        `}</Script>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

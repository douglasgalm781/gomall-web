import "./globals.css";
import Providers from "./providers";
import BackgroundImage from "@/components/BackgroundImage";
import TopNav from "@/components/TopNav";
import GoToTop from "@/components/GoToTop";
import BottomBar from "@/components/BottomBar";
import Footer from "@/components/Footer";
import LayoutSpacer from "@/components/LayoutSpacer";

export const metadata = {
  title: "GoMall",
  description: "GoMall payment platform",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="phone">
            <BackgroundImage />
            <div className="relative z-10">
              <TopNav />
              <div className="hidden lg:block h-16" />
              {children}
              <Footer />
              <GoToTop />
              <BottomBar />
              <LayoutSpacer />
            </div>
            <div className="grain" aria-hidden="true" />
          </div>
        </Providers>
      </body>
    </html>
  );
}

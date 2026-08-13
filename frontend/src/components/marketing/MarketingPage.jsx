import { MarketingFooter } from "./MarketingFooter";
import { MarketingHeader } from "./MarketingHeader";

export function MarketingPage({ children }) {
  return (
    <div className="landing-page min-h-dvh overflow-x-hidden bg-[#090908] text-stone-100">
      <a
        href="#contenido"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-lg focus:bg-stone-100 focus:px-4 focus:py-2 focus:text-stone-950"
      >
        Saltar al contenido
      </a>
      <MarketingHeader />
      <main id="contenido">{children}</main>
      <MarketingFooter />
    </div>
  );
}

import { Bento } from "./Bento";
import { Comparison } from "./Comparison";
import { CtaBand } from "./CtaBand";
import { Faq } from "./Faq";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { LandingNav } from "./LandingNav";
import { Numbers } from "./Numbers";
import { ProductTabs } from "./ProductTabs";
import { Problem } from "./Problem";
import { SourcesStrip } from "./SourcesStrip";
import { WillNotClaim } from "./WillNotClaim";

export function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-bg text-fg">
      <LandingNav />
      <main>
        
        
        <Problem />
        
        <ProductTabs />
        
        <WillNotClaim />
        
        
        <Faq />
        <CtaBand />
      </main>
      
    </div>
  );
}

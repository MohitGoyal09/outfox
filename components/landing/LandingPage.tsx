import { Reveal } from "@/components/aceternity/reveal";
import { Comparison } from "./Comparison";
import { CtaBand } from "./CtaBand";
import { Faq } from "./Faq";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { LandingNav } from "./LandingNav";
import { Numbers } from "./Numbers";
import { ProductShowcase } from "./ProductShowcase";
import { Problem } from "./Problem";
import { SourcesStrip } from "./SourcesStrip";
import { StructuredData } from "./StructuredData";
import { WatchesGrid } from "./WatchesGrid";
import { WatchItWork } from "./WatchItWork";
import { WillNotClaim } from "./WillNotClaim";

export function LandingPage() {
  return (
    <div className="l-theme min-h-dvh overflow-x-clip text-fg">
      <StructuredData />
      <LandingNav />
      <main>
        
        <Reveal>
          <Problem />
        </Reveal>
        <WatchItWork />
        
        
        <ProductShowcase />
        <Reveal>
          <WillNotClaim />
        </Reveal>
        <Reveal>
          
        </Reveal>
        
        <Reveal>
          
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
        
      </main>
      
    </div>
  );
}

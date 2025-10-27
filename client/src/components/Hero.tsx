import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import heroImage from "@assets/generated_images/Forex_trading_desk_hero_aa219035.png";

export default function Hero() {
  return (
    <section className="relative w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background z-10" />
      <img
        src={heroImage}
        alt="Forex trading platform"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <div className="relative z-20 container max-w-7xl mx-auto px-4 py-24 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Discover Powerful Forex Expert Advisors
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Browse, review, and deploy proven MT4/MT5 trading algorithms. Join our community of traders sharing strategies and performance insights.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            <Button size="lg" className="bg-primary/90 backdrop-blur hover:bg-primary border border-primary-border" data-testid="button-browse-eas">
              Browse EAs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="bg-background/10 backdrop-blur border-white/20 text-white hover:bg-background/20" data-testid="button-upload-your-ea">
              Upload Your EA
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 bg-background/10 backdrop-blur border border-white/10 rounded-lg p-4">
              <div className="bg-primary/20 rounded-md p-2">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white text-lg">500+</div>
                <div className="text-sm text-white/80">Expert Advisors</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-background/10 backdrop-blur border border-white/10 rounded-lg p-4">
              <div className="bg-primary/20 rounded-md p-2">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white text-lg">Verified</div>
                <div className="text-sm text-white/80">Performance Data</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-background/10 backdrop-blur border border-white/10 rounded-lg p-4">
              <div className="bg-primary/20 rounded-md p-2">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white text-lg">10K+</div>
                <div className="text-sm text-white/80">Active Traders</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

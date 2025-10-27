import { Button } from "@/components/ui/button";
import { MessageSquare, Users, TrendingUp, Shield } from "lucide-react";
import heroImage from "@assets/generated_images/Forex_trading_desk_hero_aa219035.png";

export default function ForumHero() {
  return (
    <section className="relative w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background z-10" />
      <img
        src={heroImage}
        alt="EA Trading Community"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <div className="relative z-20 container max-w-7xl mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Expert Advisor Trading Community
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Join thousands of traders discussing strategies, sharing insights, and optimizing MT4/MT5 Expert Advisors. Ask questions, share your experience, and learn from the community.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            <Button size="lg" className="bg-primary/90 backdrop-blur hover:bg-primary border border-primary-border" data-testid="button-browse-discussions">
              Browse Discussions
            </Button>
            <Button size="lg" variant="outline" className="bg-background/10 backdrop-blur border-white/20 text-white hover:bg-background/20" data-testid="button-start-discussion">
              Start a Discussion
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2 bg-background/10 backdrop-blur border border-white/10 rounded-lg p-4">
              <MessageSquare className="h-6 w-6 text-white" />
              <div className="text-center">
                <div className="font-bold text-white text-xl">15K+</div>
                <div className="text-xs text-white/80">Discussions</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2 bg-background/10 backdrop-blur border border-white/10 rounded-lg p-4">
              <Users className="h-6 w-6 text-white" />
              <div className="text-center">
                <div className="font-bold text-white text-xl">10K+</div>
                <div className="text-xs text-white/80">Members</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2 bg-background/10 backdrop-blur border border-white/10 rounded-lg p-4">
              <TrendingUp className="h-6 w-6 text-white" />
              <div className="text-center">
                <div className="font-bold text-white text-xl">50K+</div>
                <div className="text-xs text-white/80">Replies</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2 bg-background/10 backdrop-blur border border-white/10 rounded-lg p-4">
              <Shield className="h-6 w-6 text-white" />
              <div className="text-center">
                <div className="font-bold text-white text-xl">24/7</div>
                <div className="text-xs text-white/80">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

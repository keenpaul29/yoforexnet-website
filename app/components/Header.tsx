"use client";

import { Search, Menu, User, Bell, MessageSquare, Coins, LogIn, LogOut, Lightbulb, HelpCircle, TrendingUp, Settings, Code, Award, BookOpen, Activity, Wrench, FileCode, GraduationCap, MessageCircle as MessageCircleIcon, Trophy, BarChart3, Rocket, ShieldAlert, Plus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

// Category data for Release EA dropdown
const publishCategories = [
  { slug: "strategy-discussion", name: "Strategy Discussion", icon: Lightbulb, hint: "Share trading strategies and setups" },
  { slug: "beginner-questions", name: "Beginner Questions", icon: HelpCircle, hint: "Start here for basic questions" },
  { slug: "performance-reports", name: "Performance Reports", icon: TrendingUp, hint: "Backtest & live test results" },
  { slug: "technical-support", name: "Technical Support", icon: Settings, hint: "Installation & VPS help" },
  { slug: "ea-development", name: "EA Development", icon: Code, hint: "MQL4/MQL5 coding help" },
  { slug: "success-stories", name: "Success Stories", icon: Award, hint: "Trading wins & lessons" },
  { slug: "ea-library", name: "EA Library", icon: BookOpen, hint: "Upload your EAs here" },
  { slug: "indicators", name: "Indicators", icon: Activity, hint: "Share custom indicators" },
  { slug: "tools-utilities", name: "Tools & Utilities", icon: Wrench, hint: "Trading tools & panels" },
  { slug: "source-code", name: "Source Code", icon: FileCode, hint: "Open source EA/indicator code" },
  { slug: "learning-hub", name: "Learning Hub", icon: GraduationCap, hint: "Guides & courses" },
  { slug: "qa-help", name: "Q&A / Help", icon: MessageCircleIcon, hint: "Quick answers" },
  { slug: "bounties", name: "Bounties", icon: Trophy, hint: "Offer rewards for help" },
  { slug: "rankings", name: "Rankings", icon: BarChart3, hint: "Top EAs & contributors" },
  { slug: "commercial-trials", name: "Commercial Trials", icon: Rocket, hint: "Vendor demos & trials" },
  { slug: "scam-watch", name: "Scam Watch", icon: ShieldAlert, hint: "Report scams & fraud" },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useLocation();
  const { user, isLoading: isAuthLoading, isAuthenticated, login, logout } = useAuth();
  
  const { data: coinsData } = useQuery<{ totalCoins: number; weeklyEarned: number; rank: number | null }>({
    queryKey: ["/api/user", user?.id, "coins"],
    enabled: !!user?.id,
  });

  const userCoins = coinsData?.totalCoins ?? 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 cursor-pointer" data-testid="link-home">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline">YoForex</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/categories">
              <Button 
                variant={location === "/categories" ? "default" : "ghost"} 
                size="sm" 
                data-testid="button-categories"
                aria-current={location === "/categories" ? "page" : undefined}
              >
                Categories
              </Button>
            </Link>
            <Link href="/discussions">
              <Button 
                variant={location === "/discussions" ? "default" : "ghost"} 
                size="sm" 
                data-testid="button-discussions"
                aria-current={location === "/discussions" ? "page" : undefined}
              >
                Discussions
              </Button>
            </Link>
            
            {/* Release EA Dropdown with Hover */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-9 text-sm font-medium" data-testid="button-release-ea">
                    Release EA
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[500px] gap-2 p-4 md:grid-cols-2" data-testid="menu-release-categories">
                      {publishCategories.map((cat) => (
                        <li key={cat.slug}>
                          <NavigationMenuLink asChild>
                            <a
                              href={`/publish?category=${cat.slug}`}
                              onClick={(e) => {
                                e.preventDefault();
                                setLocation(`/publish?category=${cat.slug}`);
                              }}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              data-testid={`link-publish-${cat.slug}`}
                            >
                              <div className="flex items-center gap-2">
                                <cat.icon className="h-4 w-4" />
                                <div className="text-sm font-medium leading-none">{cat.name}</div>
                              </div>
                              <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
                                {cat.hint}
                              </p>
                            </a>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <Link href="/brokers">
              <Button 
                variant={location === "/brokers" ? "default" : "ghost"} 
                size="sm" 
                data-testid="button-broker-reviews"
                aria-current={location === "/brokers" ? "page" : undefined}
              >
                Broker Reviews
              </Button>
            </Link>
            <Link href="/members">
              <Button 
                variant={location === "/members" ? "default" : "ghost"} 
                size="sm" 
                data-testid="button-members"
                aria-current={location === "/members" ? "page" : undefined}
              >
                Members
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search discussions..."
              className="pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <Link href="/new-thread">
                <Button size="sm" className="hidden sm:flex" data-testid="button-new-thread">
                  <Plus className="h-4 w-4 mr-1" />
                  New Thread
                </Button>
              </Link>
              
              <Link href="/recharge">
                <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20 hover-elevate cursor-pointer">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm" data-testid="text-header-coins">{userCoins.toLocaleString()}</span>
                </div>
              </Link>
              
              <Link href="/messages">
                <Button variant="ghost" size="icon" data-testid="button-messages">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>
              
              <Button variant="ghost" size="icon" className="hidden md:flex relative" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  3
                </Badge>
              </Button>
            </>
          )}
          
          {isAuthLoading ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.username} />
                    <AvatarFallback>{(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel data-testid="text-user-name">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem data-testid="link-dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/customize">
                  <DropdownMenuItem data-testid="link-customize-dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Customize Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem data-testid="link-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={login} data-testid="button-login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          )}
          
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

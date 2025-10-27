import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import RechargePage from "@/pages/RechargePage";
import EarnCoinsPage from "@/pages/EarnCoinsPage";
import TransactionHistoryPage from "@/pages/TransactionHistoryPage";
import WithdrawalPage from "@/pages/WithdrawalPage";
import WithdrawalHistoryPage from "@/pages/WithdrawalHistoryPage";
import MarketplacePage from "@/pages/MarketplacePage";
import ContentDetailPage from "@/pages/ContentDetailPage";
import PublishContentPage from "@/pages/PublishContentPage";
import PublishPage from "@/pages/PublishPage";
import DashboardPage from "@/pages/DashboardPage";
import UserProfilePage from "@/pages/UserProfilePage";
import UserSettingsPage from "@/pages/UserSettingsPage";
import DashboardSettings from "@/pages/DashboardSettings";
import NotificationsPage from "@/pages/NotificationsPage";
import MessagesPage from "@/pages/MessagesPage";
import BrokerDirectoryPage from "@/pages/BrokerDirectoryPage";
import BrokerProfilePage from "@/pages/BrokerProfilePage";
import SubmitBrokerReviewPage from "@/pages/SubmitBrokerReviewPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryDiscussionPage from "@/pages/CategoryDiscussionPage";
import ThreadDetailPage from "@/pages/ThreadDetailPage";
import MembersPage from "@/pages/MembersPage";
import Leaderboard from "@/pages/Leaderboard";
import DiscussionsPage from "@/pages/DiscussionsPage";
import SubmitFeedbackPage from "@/pages/SubmitFeedbackPage";
import APIDocumentationPage from "@/pages/APIDocumentationPage";
import ContactSupportPage from "@/pages/ContactSupportPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/recharge" component={RechargePage} />
      <Route path="/earn-coins" component={EarnCoinsPage} />
      <Route path="/transactions" component={TransactionHistoryPage} />
      <Route path="/withdrawal" component={WithdrawalPage} />
      <Route path="/withdrawal/history" component={WithdrawalHistoryPage} />
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/content/:slug" component={ContentDetailPage} />
      <Route path="/publish" component={PublishPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/dashboard/customize" component={DashboardSettings} />
      <Route path="/user/:username" component={UserProfilePage} />
      <Route path="/settings" component={UserSettingsPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/brokers" component={BrokerDirectoryPage} />
      <Route path="/brokers/submit-review" component={SubmitBrokerReviewPage} />
      <Route path="/brokers/:slug" component={BrokerProfilePage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/category/:slug" component={CategoryDiscussionPage} />
      <Route path="/thread/:slug" component={ThreadDetailPage} />
      <Route path="/discussions" component={DiscussionsPage} />
      <Route path="/members" component={MembersPage} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/feedback" component={SubmitFeedbackPage} />
      <Route path="/api-docs" component={APIDocumentationPage} />
      <Route path="/support" component={ContactSupportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

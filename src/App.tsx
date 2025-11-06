import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Products from "./pages/Products";
import { HashRouter, Routes, Route } from "react-router-dom";
import { HashRouter, Routes, Route } from 'react-router-dom';
import PremiumPlansPage from '@/pages/PremiumPlans';
import AdminDashboard from '@/pages/AdminDashboard';
import { PlansPage } from "@/pages/PlansPage";
import { PlanRequestsPage } from "@/pages/admin/PlanRequestsPage";
import { SellerActivityPage } from "@/pages/admin/SellerActivityPage";

<Route path="/admin/seller-activity" element={<SellerActivityPage />} />

// ...
<Route path="/plans" element={<PlansPage />} />
<Route path="/admin/plan-requests" element={<PlanRequestsPage />} />

// ...
<HashRouter>
  <Routes>
    <Route path="/" element={<Home/>} />
    <Route path="/plans" element={<PremiumPlansPage/>} />
    <Route path="/admin/requests" element={<AdminDashboard/>} />
  </Routes>
</HashRouter>

<HashRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/products" element={<Products />} />
  </Routes>
</HashRouter>

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        {/* Shyiramo izindi pages zawe hano */}
      </Routes>
    </HashRouter>
  );
}

export default App;

import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import BlockedAccount from "./pages/BlockedAccount";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProducts from "./pages/SellerProducts";
import SellerProfile from "./pages/SellerProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import AdminNotifications from "./pages/AdminNotifications";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import ProductDetail from "./pages/ProductDetail";
import Messages from "./pages/Messages";
import Account from "./pages/Account";
import AgricultureProducts from "./pages/AgricultureProducts";
import EquipmentForLent from "./pages/EquipmentForLent";
import Updates from "./pages/Updates";
import SellerUpdates from "./pages/SellerUpdates";
import Opportunities from "./pages/Opportunities";
import OpportunityDetail from "./pages/OpportunityDetail";
import PostOpportunity from "./pages/PostOpportunity";
import AdminOpportunities from "./pages/AdminOpportunities";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/blocked" element={<BlockedAccount />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/seller-profile/:id" element={<SellerProfile />} />
          <Route path="/agriculture" element={<AgricultureProducts />} />
          <Route path="/equipment" element={<EquipmentForLent />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/account" element={<Account />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/opportunities/:id" element={<OpportunityDetail />} />
          <Route path="/post-opportunity" element={<PostOpportunity />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/updates" element={<SellerUpdates />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/opportunities" element={<AdminOpportunities />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

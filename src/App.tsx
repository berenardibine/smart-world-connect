import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import BlockedAccount from "./pages/BlockedAccount";
import IdentityVerification from "./pages/IdentityVerification";
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
import AdminPostProduct from "./pages/AdminPostProduct";
import AdminPlans from "./pages/AdminPlans";
import MarketingPosts from "./pages/admin/MarketingPosts";
import Marketing from "./pages/Marketing";
import ContactMessages from "./pages/admin/ContactMessages";
import AdsManagement from "./pages/admin/AdsManagement";
import SellerAnalytics from "./pages/SellerAnalytics";
import AdminAnalyticsDashboard from "./pages/AdminAnalyticsDashboard";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import CategoryPage from "./pages/CategoryPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/blocked" element={<BlockedAccount />} />
          <Route path="/identity-verification" element={<IdentityVerification />} />
          
          {/* SEO-friendly product routes */}
          <Route path="/product/:slugId" element={<ProductDetail />} />
          <Route path="/products/:name/by/:seller" element={<ProductDetail />} />
          <Route path="/products/:name" element={<ProductDetail />} />
          
          {/* SEO-friendly opportunity routes */}
          <Route path="/opportunities/:id" element={<OpportunityDetail />} />
          <Route path="/opportunities/:title/by/:poster" element={<OpportunityDetail />} />
          
          {/* SEO-friendly equipment routes */}
          <Route path="/equipment/:name/by/:owner" element={<ProductDetail />} />
          <Route path="/equipment/:name" element={<ProductDetail />} />
          
          {/* SEO-friendly agriculture routes */}
          <Route path="/agriculture/:product/by/:farmer" element={<ProductDetail />} />
          <Route path="/agriculture/:product" element={<ProductDetail />} />
          
          <Route path="/seller-profile/:id" element={<SellerProfile />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/agriculture" element={<AgricultureProducts />} />
          <Route path="/equipment" element={<EquipmentForLent />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/account" element={<Account />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/post-opportunity" element={<PostOpportunity />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/updates" element={<SellerUpdates />} />
          <Route path="/seller/analytics" element={<SellerAnalytics />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/post-product" element={<AdminPostProduct />} />
          <Route path="/admin/opportunities" element={<AdminOpportunities />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsDashboard />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/plans" element={<AdminPlans />} />
          <Route path="/admin/marketing" element={<MarketingPosts />} />
          <Route path="/admin/messages" element={<ContactMessages />} />
          <Route path="/admin/ads" element={<AdsManagement />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

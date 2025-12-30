import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { RegionProvider } from "@/contexts/RegionContext";
import { LocationSelectionModal } from "@/components/LocationSelectionModal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import BlockedAccount from "./pages/BlockedAccount";
import IdentityVerification from "./pages/IdentityVerification";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProducts from "./pages/SellerProducts";
import SellerProfile from "./pages/SellerProfile";
import SellerShop from "./pages/SellerShop";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import AdminNotifications from "./pages/AdminNotifications";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import ProductDetail from "./pages/ProductDetail";
import Account from "./pages/Account";
import AgricultureProducts from "./pages/AgricultureProducts";
import EquipmentForLent from "./pages/EquipmentForLent";
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
import SellerReferrals from "./pages/SellerReferrals";
import SellerMarketing from "./pages/SellerMarketing";
import AIManagerDashboard from "./pages/admin/AIManagerDashboard";
import ReferralAnalytics from "./pages/admin/ReferralAnalytics";
import LinkAnalytics from "./pages/admin/LinkAnalytics";
import LocationManagement from "./pages/admin/LocationManagement";
import Shops from "./pages/Shops";
import ShopDetail from "./pages/ShopDetail";
import Shop from "./pages/Shop";
import Community from "./pages/Community";
import CommunityDetail from "./pages/CommunityDetail";
import Rewards from "./pages/Rewards";
import Academy from "./pages/Academy";
import PendingVerification from "./pages/PendingVerification";
import CommunityCreate from "./pages/seller/CommunityCreate";
import CommunitySettings from "./pages/seller/CommunitySettings";
import RewardsManagement from "./pages/admin/RewardsManagement";
import CommunityModeration from "./pages/admin/CommunityModeration";
import LearningManagement from "./pages/admin/LearningManagement";
import { SellerActivityPage } from "./pages/admin/SellerActivityPage";
import { PlanRequestsPage } from "./pages/admin/PlanRequestsPage";
import RegionalHomePage from "./pages/RegionalHomePage";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RegionProvider>
          <Toaster />
          <Sonner />
          <LocationSelectionModal />
          <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/region/:type/:slug" element={<RegionalHomePage />} />
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
          <Route path="/account" element={<Account />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/shop/:id" element={<ShopDetail />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<CommunityDetail />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/pending-verification" element={<PendingVerification />} />
          <Route path="/post-opportunity" element={<PostOpportunity />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/community/create" element={<CommunityCreate />} />
          <Route path="/seller/community/:id/settings" element={<CommunitySettings />} />
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/shop" element={<SellerShop />} />
          <Route path="/seller/analytics" element={<SellerAnalytics />} />
          <Route path="/seller/referrals" element={<SellerReferrals />} />
          <Route path="/seller/marketing" element={<SellerMarketing />} />
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
          <Route path="/admin/ai-manager" element={<AIManagerDashboard />} />
          <Route path="/admin/referrals" element={<ReferralAnalytics />} />
          <Route path="/admin/link-analytics" element={<LinkAnalytics />} />
          <Route path="/admin/locations" element={<LocationManagement />} />
          <Route path="/admin/rewards" element={<RewardsManagement />} />
          <Route path="/admin/learning" element={<LearningManagement />} />
          <Route path="/admin/seller-activity" element={<SellerActivityPage />} />
          <Route path="/admin/plan-requests" element={<PlanRequestsPage />} />
          <Route path="/admin/community" element={<CommunityModeration />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
        </RegionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

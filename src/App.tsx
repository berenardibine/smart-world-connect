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
import { Helmet } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Marketing from "./pages/Marketing";

function App() {
  return (
      <BrowserRouter>
            {/* 🧠 Global Meta Defaults */}
                  <Helmet>
                          <title>Rwanda Smart Market – Smart Shopping, Smarter Business</title>
                                  <meta
                                            name="description"
                                                      content="Shop, sell, and advertise smarter on Rwanda Smart Market — Rwanda’s leading digital marketplace."
                                                              />
                                                                      <meta property="og:type" content="website" />
                                                                              <meta property="og:url" content="https://rwanda-smart-market.vercel.app/" />
                                                                                      <meta
                                                                                                property="og:image"
                                                                                                          content="https://rwanda-smart-market.vercel.app/favicon.png"
                                                                                                                  />
                                                                                                                          <meta property="og:title" content="Rwanda Smart Market" />
                                                                                                                                  <meta
                                                                                                                                            property="og:description"
                                                                                                                                                      content="Discover the smart way to trade, advertise, and grow your business in Rwanda."
                                                                                                                                                              />
                                                                                                                                                                      <meta property="twitter:card" content="summary_large_image" />
                                                                                                                                                                              <meta property="twitter:title" content="Rwanda Smart Market" />
                                                                                                                                                                                      <meta
                                                                                                                                                                                                property="twitter:description"
                                                                                                                                                                                                          content="Smart shopping, smarter business — built for Rwanda’s digital generation."
                                                                                                                                                                                                                  />
                                                                                                                                                                                                                          <meta
                                                                                                                                                                                                                                    property="twitter:image"
                                                                                                                                                                                                                                              content="https://rwanda-smart-market.vercel.app/favicon.png"
                                                                                                                                                                                                                                                      />
                                                                                                                                                                                                                                                            </Helmet>

                                                                                                                                                                                                                                                                  {/* 🚀 Routing */}
                                                                                                                                                                                                                                                                        <Routes>
                                                                                                                                                                                                                                                                                <Route path="/" element={<Home />} />
                                                                                                                                                                                                                                                                                        <Route path="/product/:slugId" element={<ProductDetail />} />
                                                                                                                                                                                                                                                                                                <Route path="/marketing" element={<Marketing />} />
                                                                                                                                                                                                                                                                                                      </Routes>
                                                                                                                                                                                                                                                                                                          </BrowserRouter>
                                                                                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                            export default App;
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
          <Route path="/account" element={<Account />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/post-opportunity" element={<PostOpportunity />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/products" element={<SellerProducts />} />
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
          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DealerAuthGuard from "./components/DealerAuthGuard";

// Lazy-loaded pages — each page is only downloaded when the user navigates to it
const Home = lazy(() => import("./pages/Home"));
const Browse = lazy(() => import("./pages/Browse"));
const CarDetail = lazy(() => import("./pages/CarDetail"));
const LifestyleSearch = lazy(() => import("./pages/LifestyleSearch"));
const Compare = lazy(() => import("./pages/Compare"));
const Finance = lazy(() => import("./pages/Finance"));
const FinanceCheck = lazy(() => import("./pages/FinanceCheck"));
const BecomeADealer = lazy(() => import("./pages/BecomeADealer"));
const DealerProfile = lazy(() => import("./pages/DealerProfile"));
const DealerOnboarding = lazy(() => import("./pages/DealerOnboarding"));
const MyReservations = lazy(() => import("./pages/MyReservations"));
const EvFaultsBrowser = lazy(() => import("./pages/EvFaultsBrowser"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUpWithRole = lazy(() => import("./pages/SignUpWithRole"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Account pages
const AccountSettings = lazy(() => import("./pages/AccountSettings"));

// Admin pages
const AdminSync = lazy(() => import("./pages/AdminSync"));
const AdminApplications = lazy(() => import("./pages/AdminApplications"));
const AdminDealers = lazy(() => import("./pages/admin/AdminDealers"));
const AdminInventoryHealth = lazy(() => import("./pages/admin/AdminInventoryHealth"));
const AdminOneAutoImport = lazy(() => import("./pages/admin/AdminOneAutoImport"));

// Dealer pages
const DealerDashboard = lazy(() => import("./pages/dealer/DealerDashboard"));
const MyInventory = lazy(() => import("./pages/dealer/MyInventory"));
const AddVehicle = lazy(() => import("./pages/dealer/AddVehicle"));
const EditVehicle = lazy(() => import("./pages/dealer/EditVehicle"));
const DealerMarketplace = lazy(() => import("./pages/dealer/DealerMarketplace"));
const DealerMarketplaceDetails = lazy(() => import("./pages/dealer/DealerMarketplaceDetails"));
const DealerAnalytics = lazy(() => import("./pages/dealer/Analytics"));
const BulkUpload = lazy(() => import("./pages/dealer/BulkUpload"));
const DealerCalendar = lazy(() => import("./pages/dealer/DealerCalendar"));
const LiveAuction = lazy(() => import("./pages/dealer/LiveAuction"));
const MyAuctions = lazy(() => import("./pages/dealer/MyAuctions"));
const AuctionAnalytics = lazy(() => import("./pages/dealer/AuctionAnalytics"));
const MyWins = lazy(() => import("./pages/dealer/MyWins"));
const MyShortlist = lazy(() => import("./pages/dealer/MyShortlist"));
const Subscription = lazy(() => import("./pages/dealer/Subscription"));
const SubscriptionSuccess = lazy(() => import("./pages/dealer/SubscriptionSuccess"));
const SubscriptionManage = lazy(() => import("./pages/dealer/SubscriptionManage"));
const SubscriptionAnalytics = lazy(() => import("./pages/dealer/SubscriptionAnalytics"));
const PurchaseDetails = lazy(() => import("./pages/dealer/PurchaseDetails"));
const Cart = lazy(() => import("./pages/dealer/Cart"));
const Watchlist = lazy(() => import("./pages/dealer/Watchlist"));
const DealerSettings = lazy(() => import("./pages/dealer/DealerSettings"));
const DealerInventoryHealth = lazy(() => import("./pages/dealer/DealerInventoryHealth"));

// Lightweight page loading skeleton
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sign-in" component={SignIn} />
        <Route path="/sign-in/:rest*" component={SignIn} />
        <Route path="/sign-up" component={SignUpWithRole} />
        <Route path="/sign-up/:rest*" component={SignUpWithRole} />
        <Route path="/browse" component={Browse} />
        <Route path="/admin/sync" component={AdminSync} />
        <Route path="/admin/applications" component={AdminApplications} />
        <Route path="/admin/dealers" component={AdminDealers} />
        <Route path="/admin/inventory-health" component={AdminInventoryHealth} />
        <Route path="/admin/oneauto-import" component={AdminOneAutoImport} />
        <Route path="/cars/:id" component={CarDetail} />
        <Route path="/lifestyle-search" component={LifestyleSearch} />
        <Route path="/compare" component={Compare} />
        <Route path="/become-a-dealer" component={BecomeADealer} />
        <Route path="/dealer/onboarding" component={DealerOnboarding} />
        <Route path="/reservations" component={MyReservations} />
        <Route path="/finance" component={Finance} />
        <Route path="/finance-check" component={FinanceCheck} />
        <Route path="/dealers/:id" component={DealerProfile} />
        <Route path="/dealer/dashboard">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <DealerDashboard />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/purchases/:id">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <PurchaseDetails />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/cart">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <Cart />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/watchlist">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <Watchlist />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/ev-faults">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <EvFaultsBrowser />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/settings">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <DealerSettings />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/inventory-health">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <DealerInventoryHealth />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/inventory">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MyInventory />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/add-vehicle">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <AddVehicle />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/edit-vehicle/:id">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <EditVehicle />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/marketplace/:id">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <DealerMarketplaceDetails />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/marketplace">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <DealerMarketplace />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/analytics">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <DealerAnalytics />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/bulk-upload">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <BulkUpload />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/test-drives">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <DealerCalendar />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/live-auction" component={LiveAuction} />
        <Route path="/dealer/my-auctions">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MyAuctions />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/auction-analytics">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <AuctionAnalytics />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/my-wins">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MyWins />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/shortlist">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MyShortlist />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/subscription">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <Subscription />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/subscription/success">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <SubscriptionSuccess />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/subscription/manage">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <SubscriptionManage />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/dealer/subscription/analytics">
          <DealerAuthGuard>
            <Suspense fallback={<PageLoader />}>
              <SubscriptionAnalytics />
            </Suspense>
          </DealerAuthGuard>
        </Route>
        <Route path="/account/settings" component={AccountSettings} />
        <Route path="/account">{() => <Redirect to="/account/settings" />}</Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

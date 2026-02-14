import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import RebeccaChat from "./components/RebeccaChat";
import Browse from "./pages/Browse";
import AdminSync from "./pages/AdminSync";
import CarDetail from "./pages/CarDetail";
import LifestyleSearch from "./pages/LifestyleSearch";
import Compare from "./pages/Compare";
import DealerDashboard from "./pages/dealer/DealerDashboard";
import MyInventory from "./pages/dealer/MyInventory";
import AddVehicle from "./pages/dealer/AddVehicle";
import DealerMarketplace from "./pages/dealer/DealerMarketplace";
import DealerAnalytics from "./pages/dealer/Analytics";
import BulkUpload from "./pages/dealer/BulkUpload";
import DealerCalendar from "./pages/dealer/DealerCalendar";
import DealerAuthGuard from "./components/DealerAuthGuard";
import AdminApplications from "./pages/AdminApplications";
import AdminDealers from "./pages/admin/AdminDealers";
import BecomeADealer from "./pages/BecomeADealer";
import MyReservations from "./pages/MyReservations";
import FinanceCheck from "./pages/FinanceCheck";
import DealerProfile from "./pages/DealerProfile";
import DealerOnboarding from "./pages/DealerOnboarding";
import Finance from "./pages/Finance";
import LiveAuction from "./pages/dealer/LiveAuction";
import Subscription from "./pages/dealer/Subscription";
import SubscriptionSuccess from "./pages/dealer/SubscriptionSuccess";
import SubscriptionManage from "./pages/dealer/SubscriptionManage";
import SubscriptionAnalytics from "./pages/dealer/SubscriptionAnalytics";
import PurchaseDetails from "./pages/dealer/PurchaseDetails";
import Cart from "./pages/dealer/Cart";
import Watchlist from "./pages/dealer/Watchlist";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/browse"} component={Browse} />
      <Route path={"/admin/sync"} component={AdminSync} />
      <Route path={'/admin/applications'} component={AdminApplications} />
      <Route path={'/admin/dealers'} component={AdminDealers} />
      <Route path={'/cars/:id'} component={CarDetail} />
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
          <DealerDashboard />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/purchases/:id">
        <DealerAuthGuard>
          <PurchaseDetails />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/cart">
        <DealerAuthGuard>
          <Cart />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/watchlist">
        <DealerAuthGuard>
          <Watchlist />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/inventory">
        <DealerAuthGuard>
          <MyInventory />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/add-vehicle">
        <DealerAuthGuard>
          <AddVehicle />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/marketplace">
        <DealerAuthGuard>
          <DealerMarketplace />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/analytics">
        <DealerAuthGuard>
          <DealerAnalytics />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/bulk-upload">
        <DealerAuthGuard>
          <BulkUpload />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/test-drives">
        <DealerAuthGuard>
          <DealerCalendar />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/live-auction">
        <DealerAuthGuard>
          <LiveAuction />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/subscription">
        <DealerAuthGuard>
          <Subscription />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/subscription/success">
        <DealerAuthGuard>
          <SubscriptionSuccess />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/subscription/manage">
        <DealerAuthGuard>
          <SubscriptionManage />
        </DealerAuthGuard>
      </Route>
      <Route path="/dealer/subscription/analytics">
        <DealerAuthGuard>
          <SubscriptionAnalytics />
        </DealerAuthGuard>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <RebeccaChat />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

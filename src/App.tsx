import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ItemDetail from "./pages/ItemDetail";
import PostItem from "./pages/PostItem";
import MyItems from "./pages/MyItems";
import Transactions from "./pages/Transactions";
import RentalDetail from "./pages/RentalDetail";
import Chat from "./pages/Chat";
import ChatRoom from "./pages/ChatRoom";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import AppNavbar from "./components/AppNavbar";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import EditItem from "./pages/EditItem";
import BankAccount from './pages/BankAccount';

const queryClient = new QueryClient();

const AppShell = () => {
  const location = useLocation();

  const hiddenTopNav = [
    "/login",
    "/register",
    "/admin/login",
  ].includes(location.pathname);

  const isMarketplacePage = [
    "/",
    "/items",
  ].includes(location.pathname);

  const isAdminPage = location.pathname.startsWith("/admin");

  const mainClassName = isMarketplacePage
    ? "w-full min-h-screen"
    : isAdminPage
      ? "w-full min-h-screen px-4 py-6 sm:px-6"
      : "w-full min-h-screen mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8";

  return (
    <>
      {!hiddenTopNav && !isAdminPage && <AppNavbar />}

      <main className={mainClassName}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/items" element={<Home />} />

          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/item/:id" element={<ItemDetail />} />

          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/dashboard" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />

          <Route path="/transactions/:id" element={<ProtectedRoute><RentalDetail /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />

          <Route path="/post-item" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
          <Route path="/my-items" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />
          <Route path="/my-items/:id/edit" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />

          <Route path="/my-rentals" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/rentals" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/my-borrowings" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bank-account"
            element={
              <ProtectedRoute>
                <BankAccount />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

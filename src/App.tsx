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
import Transactions from "./pages/Transactions";
import Chat from "./pages/Chat";
import ChatRoom from "./pages/ChatRoom";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import AppNavbar from "./components/AppNavbar";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppShell = () => {
  const location = useLocation();
  const hiddenTopNav = ["/login", "/register", "/admin/login"].includes(location.pathname);

  return (
    <>
      {!hiddenTopNav && <AppNavbar />}
      <main className="w-full max-w-5xl mx-auto px-4">
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
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
          <Route path="/post-item" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
          <Route path="/my-items" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
          <Route path="/my-rentals" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/rentals" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />

          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

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

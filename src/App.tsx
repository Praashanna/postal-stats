import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { PeriodProvider } from "@/contexts/period-context";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PeriodProvider>
          <RouterProvider router={router} />
          <Toaster />
        </PeriodProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
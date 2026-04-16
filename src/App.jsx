import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { queryClientInstance } from "@/lib/query-client";
import PageNotFound from "@/lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { SemaineProvider } from "@/lib/SemaineContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import UnifiedLayout, { ModuleLayout } from "@/components/UnifiedLayout";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Operateurs from "@/pages/Operateurs";
import Ventes from "@/pages/Ventes";
import Cartes from "@/pages/Cartes";
import Accueil from "@/pages/Accueil";
import SuiviLaboratoires from "@/pages/SuiviLaboratoires";
import PageRiad from "@/pages/PageRiad";
import PageCedric from "@/pages/PageCedric";
import PageJadujan from "@/pages/PageJadujan";
import PageRapher from "@/pages/PageRapher";
import Scanner from "@/pages/Scanner";
import Suivi from "@/pages/Suivi";
import Historique from "@/pages/Historique";
import ConfigTG from "@/pages/ConfigTG";
import Statistiques from "@/pages/Statistiques";
import FluxTendus from "@/pages/FluxTendus";

const challengeTabs = [
  { to: "/challenge", label: "Podium" },
  { to: "/challenge/operateurs", label: "Opérateurs" },
  { to: "/challenge/ventes", label: "Ventes" },
  { to: "/challenge/cartes", label: "Cartes" },
];

const laboTabs = [
  { to: "/laboratoires", label: "Accueil" },
  { to: "/laboratoires/suivi", label: "Suivi global" },
  { to: "/laboratoires/riad", label: "Riad" },
  { to: "/laboratoires/cedric", label: "Cédric" },
  { to: "/laboratoires/jadujan", label: "Jadujan" },
  { to: "/laboratoires/rapher", label: "Rapher" },
];

const tgTabs = [
  { to: "/tg", label: "Scanner" },
  { to: "/tg/suivi", label: "Suivi" },
  { to: "/tg/statistiques", label: "Statistiques" },
  { to: "/tg/historique", label: "Historique" },
  { to: "/tg/config", label: "Configuration" },
];

const vigilanceTabs = [
  { to: "/vigilance", label: "Références" },
];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    }

    if (authError.type === "auth_required") {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<UnifiedLayout />}>
        <Route index element={<Home />} />

        <Route
          path="/challenge"
          element={
            <ModuleLayout
              badge="Module 1"
              title="Challenge opérateurs"
              description="Suivi du concours par équipe, ventes par opérateur et cartes bonus."
              tabs={challengeTabs}
            />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="operateurs" element={<Operateurs />} />
          <Route path="ventes" element={<Ventes />} />
          <Route path="cartes" element={<Cartes />} />
        </Route>

        <Route
          path="/laboratoires"
          element={
            <ModuleLayout
              badge="Module 2"
              title="Comparatif laboratoires"
              description="Analyse du CA laboratoire par mois, en N versus N-1, avec vues acheteurs."
              tabs={laboTabs}
            />
          }
        >
          <Route index element={<Accueil />} />
          <Route path="suivi" element={<SuiviLaboratoires />} />
          <Route path="riad" element={<PageRiad />} />
          <Route path="cedric" element={<PageCedric />} />
          <Route path="jadujan" element={<PageJadujan />} />
          <Route path="rapher" element={<PageRapher />} />
        </Route>

        <Route
          path="/tg"
          element={
            <ModuleLayout
              badge="Module 3"
              title="Têtes de gondole"
              description="Pilotage des têtes de gondole, scan terrain, historique et statistiques produit."
              tabs={tgTabs}
            />
          }
        >
          <Route index element={<Scanner />} />
          <Route path="suivi" element={<Suivi />} />
          <Route path="historique" element={<Historique />} />
          <Route path="config" element={<ConfigTG />} />
          <Route path="statistiques" element={<Statistiques />} />
        </Route>

        <Route
          path="/vigilance"
          element={
            <ModuleLayout
              badge="Module 4"
              title="Vigilance références"
              description="Surveillance hebdomadaire des références sensibles par acheteur, ventes et stock."
              tabs={vigilanceTabs}
            />
          }
        >
          <Route index element={<FluxTendus />} />
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SemaineProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </SemaineProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

import { useState } from "react";
import type { Screen, ShipmentForm, ServiceChoice } from "./lib/schema";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import GetRates from "./screens/GetRates";
import CreateShipment from "./screens/CreateShipment";
import ShipmentPlaced from "./screens/ShipmentPlaced";
import AdminPanel from "./screens/AdminPanel";
import UsagePanel from "./components/UsagePanel";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [placedForm, setPlacedForm] = useState<ShipmentForm | null>(null);
  const [pendingService, setPendingService] = useState<ServiceChoice | null>(null);
  const [adminQuery, setAdminQuery] = useState<string>("");

  // Login is full-bleed (its own layout + footer), no app shell.
  if (screen === "login") {
    return <Login onLogin={() => setScreen("dashboard")} />;
  }

  const goCreate = (service: ServiceChoice | null) => {
    setPendingService(service);
    setScreen("create");
  };

  return (
    <div className="min-h-screen flex bg-cream text-ink font-sans">
      <Sidebar
        active={screen}
        onNavigate={(s) => {
          if (s === "admin") setAdminQuery("");
          setScreen(s);
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onSearch={(query) => {
            setAdminQuery(query);
            setScreen("admin");
          }}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {screen === "dashboard" && (
            <Dashboard
              onSingleShipment={() => goCreate(null)}
              onGetRates={() => setScreen("rates")}
              onBulk={() => goCreate(null)}
            />
          )}

          {screen === "rates" && (
            <GetRates
              onBook={(svc) => goCreate(svc)}
              onBack={() => setScreen("dashboard")}
            />
          )}

          {screen === "create" && (
            <CreateShipment
              initialService={pendingService ?? undefined}
              onPlaced={(form) => {
                setPlacedForm(form);
                setScreen("placed");
              }}
            />
          )}

          {screen === "placed" && placedForm && (
            <ShipmentPlaced
              form={placedForm}
              onNewOrder={() => {
                setPlacedForm(null);
                setPendingService(null);
                setScreen("create");
              }}
            />
          )}

          {screen === "admin" && <AdminPanel query={adminQuery} />}
        </main>
      </div>
      <UsagePanel />
    </div>
  );
}

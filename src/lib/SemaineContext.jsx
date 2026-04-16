import { createContext, useContext, useState, useEffect } from "react";
import { getSemaineActuelle } from "@/lib/semaineUtils";

const SemaineContext = createContext(null);

const STORAGE_KEY = "challenge_semaine_selected";

export function SemaineProvider({ children }) {
  const [semaine, setSemaineState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || getSemaineActuelle();
  });

  function setSemaine(val) {
    setSemaineState(val);
    localStorage.setItem(STORAGE_KEY, val);
  }

  return (
    <SemaineContext.Provider value={{ semaine, setSemaine }}>
      {children}
    </SemaineContext.Provider>
  );
}

export function useSemaine() {
  return useContext(SemaineContext);
}
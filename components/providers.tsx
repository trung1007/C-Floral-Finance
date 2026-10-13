'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
type AppCtx = { refresh: () => void; version: number; toast: (s: string) => void };
const Context = createContext<AppCtx>({ refresh: () => {}, version: 0, toast: () => {} });
export function Providers({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [msg, setMsg] = useState('');
  const refresh = () => setVersion((v) => v + 1);
  const toast = (s: string) => {
    setMsg(s);
    setTimeout(() => setMsg(''), 3200);
  };
  return (
    <Context.Provider value={{ refresh, version, toast }}>
      {children}
      {msg && <div className="toast">{msg}</div>}
    </Context.Provider>
  );
}
export function useApp() {
  return useContext(Context);
}

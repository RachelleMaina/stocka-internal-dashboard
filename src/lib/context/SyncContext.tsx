import React, { createContext, useContext, useEffect, useState } from "react";

const SyncContext = createContext<{
  syncStatus: string;
}>({ syncStatus: "idle" });

export const useSyncContext = () => useContext(SyncContext);

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing">("idle");

  useEffect(() => {
    const channel = new BroadcastChannel("sync_channel");

    channel.onmessage = (event) => {
      setSyncStatus(event.data.status); // accepts: 'started' | 'completed' | 'failed'
    };

    return () => channel.close();
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus }}>
      {children}
    </SyncContext.Provider>
  );
};

"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";


interface UserProfile {
  session_id: string;
  user_id: string;
  profile_id: string;
  phone: string;
  email: string;
  full_name: string;
}

interface State {
  user_profile: UserProfile | null;
 
}

type Action =
  | { type: "LOGIN"; user_profile: UserProfile }
  | { type: "LOGOUT" }


const initialState: State = {

  user_profile: null,
};

const AppStateContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        user_profile: action.user_profile,
      };
    case "LOGOUT":
      return { ...state, user_profile: null };
  
    default:
      return state;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // No auth check here anymore — middleware handles redirects
  // Fetch profile lazily when needed (e.g. in protected pages or after login)

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
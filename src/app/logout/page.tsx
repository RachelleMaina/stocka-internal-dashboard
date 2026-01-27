"use client";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { logoutBackofficeUser } from "@/lib/utils/auth";

import { useRouter } from "next/navigation";

import { useEffect } from "react";

const LogOutUser = () => {
  const router = useRouter();
  const { dispatch } = useAppState();

  useEffect(() => {
    const apiCall = async () => {
      const session_id = JSON.parse(localStorage.getItem("session_id")!);
      logoutBackofficeUser();
      dispatch({
        type: "BACKOFFICE_LOGOUT",
      });

      try {
        await api.post("/api/auth/logout", { session_id });
      } catch (error: any) {
        console.log(error);
      } finally {
        router.push(routes.backofficeLogin);
      }
    };
    apiCall();
  }, [dispatch, router]);

  return null;
};
export default LogOutUser;


import { useAppState } from "@/lib/context/AppState";
import { hasPermission } from "@/lib/utils/helpers";
import { ReactNode } from "react";


type PermissionProps = {
  resource: string;
  action: string;
  children: ReactNode;
  isPage?: boolean; // True for full pages, false for buttons/elements
};

export function Permission({ resource, action, children, isPage = false }: PermissionProps) {
const {backoffice_user_profile, pos_user_profile}=useAppState()
  const user = backoffice_user_profile || pos_user_profile;

  // if (!user) {
  //   return isPage ? (
  //     <div className="p-6">
  //       <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 p-8 text-center">
  //         <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
  //           Access Denied
  //         </h2>
  //         <p className="text-neutral-600 dark:text-neutral-400">
  //           You do not have permission to access this page.
  //         </p>
  //       </div>
  //     </div>
  //   ) : null;
  // }


  const is_superadmin= user?.is_superadmin || false;
  const permissions = user?.permissions || user?.role?.permissions || [];

  // const allowed = hasPermission(permissions, {
  //   resource,
  //   action,
  //   isSuperadmin: is_superadmin,
  // });

  const allowed = true;


  if (!allowed) {
    return isPage ? (
      <div className="p-6">
        <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 p-8 text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Access Denied
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    ) : null;
  }

  return <>{children}</>;
}

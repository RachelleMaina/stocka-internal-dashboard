
"use client";

import LinkCard from "@/components/backoffice/LinkCard";
import PageHeader from "@/components/common/PageHeader";
import { routes } from "@/constants/routes";
import { Briefcase, LayoutDashboard, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

const RolesLandingPage = () => {
  const router = useRouter();

  const links = [
    {
      title: "Internal Dashboard",
      icon: LayoutDashboard,
      onClick: () => router.push(routes.listInternalRoles),
    },
    {
      title: "Backoffice",
      icon: Briefcase,
      onClick: () => router.push(routes.listBackofficeRoles),
    },
    {
      title: "Pos",
      icon: ShoppingCart,
      onClick: () => router.push(routes.listPosRoles),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
      
      />

      <div className="flex flex-wrap gap-4 mx-4">
        {links.map((card) => (
          <LinkCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
};

export default RolesLandingPage;

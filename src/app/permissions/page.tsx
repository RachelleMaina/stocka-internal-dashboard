"use client";

import LinkCard from "@/components/backoffice/LinkCard";
import PageHeader from "@/components/common/PageHeader";
import { routes } from "@/constants/routes";
import { Briefcase, LayoutDashboard, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PermissionsLandingPage = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const links = [
    {
      title: "Internal Dashboard",
      icon: LayoutDashboard,
      onClick: () => router.push(routes.listInternalPermissions),
    },
    {
      title: "Backoffice",
      icon: Briefcase,
      onClick: () => router.push(routes.listBackofficePermissions),
    },
    {
      title: "Pos",
      icon: ShoppingCart,
      onClick: () => router.push(routes.listPosPermissions),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
      
      />

      <div className="flex flex-wrap gap-4 mx-4">
        {links.map((card) => (
          <LinkCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
};

export default PermissionsLandingPage;

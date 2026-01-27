"use client";

import LinkCard from "@/components/backoffice/LinkCard";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import { Permission } from "@/components/common/Permission";
import { routes } from "@/constants/routes";
import { BarChart3, Boxes, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const InventoryLandingPage = () => {
  const router = useRouter();
  const links = [
    {
      title: "Stock Levels",
      icon: PackageCheck,
      onClick: () => router.push(routes.stockLevels),
    },
      {
      title: "Purchases", icon: PackageCheck,
      onClick: () => router.push(routes.purchaseBatches),
    },
            {
              title: "Stock Counts",
              icon: PackageCheck,
      onClick: () => router.push(routes.stockCounts),
    },
 
  ];

  return (
  <div className="">
        <BreadcrumbWithActions
          label="Stock Levels"
          breadcrumbs={[{ name: "Stock Levels" }]}
        />
        <div className="p-3">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {links.map((card) => (
              <LinkCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </div>
  
  );
};

export default InventoryLandingPage;

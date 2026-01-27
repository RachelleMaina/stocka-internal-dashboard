"use client";

import LinkCard from "@/components/backoffice/LinkCard";
import { Permission } from "@/components/common/Permission";
import { routes } from "@/constants/routes";
import { Ban, ChefHat, CookingPot, Layers, ListChecks, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ReportsLandingPage = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const links = [
    {
      title: "Stock Card",
      icon: ListChecks,
      isNew: false,
      onClick: () => router.push(routes.stockCard),
    },
 {
      title: "Sales",
      icon: ReceiptText,
      isNew: false,
      onClick: () => router.push(routes.sales),
    },
  {
      title: "Void Bills",
      icon: Ban,
      isNew: false,
      onClick: () => router.push(routes.voidBills),
    },
    // {
    //   title: "Slow and Fast Movers",
    //   icon: ChefHat,
    //   resource: "items",
    //   action: "read",
    //   isNew: false,
    //   onClick: () => router.push(routes.slowFatsMovers),
    // },
    // {
    //   title: "Consumption VS Productions",
    //   icon: Layers,
    //   resource: "items",
    //   action: "read",
    //   isNew: false,
    //   onClick: () => router.push(routes.consumptionProduction),
    // },
    // {
    //   title: "Wastage and Shrinkage",
    //   icon: ListChecks,
    //   resource: "items",
    //   action: "read",
    //   isNew: false,
    //   onClick: () => router.push(routes.wastageShrinkage),
    // },
    // {
    //   title: "Sales VS Stock Balance",
    //   icon: ListChecks,
    //   resource: "items",
    //   action: "read",
    //   isNew: false,
    //   onClick: () => router.push(routes.salesStockBalance),
    // },{
    //     title: "Gross Margin Trend",
    //   icon: ListChecks,
    //   resource: "items",
    //   action: "read",
    //   isNew: false,
    //   onClick: () => router.push(routes.grossMarginTrend),
    // },
  ];

  const filteredLinks = links.filter((link) =>
    link.title.toLowerCase().includes(search.toLowerCase())
  );

  return (

      <div className="space-y-3">
        {/* Title + Search Row */}
        <div className="flex flex-wrap justify-between items-center bg-white dark:bg-neutral-800  p-3 shadow">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Reports
          </h1>
         
        </div>

        {/* Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3">
          {filteredLinks.map((card) => (
            <LinkCard key={card.title} {...card} />
          ))}
        </div>
      </div>
 
  );
};

export default ReportsLandingPage;

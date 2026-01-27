"use client";

import LinkCard from "@/components/backoffice/LinkCard";
import { Permission } from "@/components/common/Permission";
import { routes } from "@/constants/routes";
import { ChefHat, CookingPot, Layers, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ProductionLandingPage = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const links = [
    {
      title: "Batches",
      icon: CookingPot,
     isNew: true,
      onClick: () => router.push(routes.productionBatches),
    },
    
     {
      title: "Recipes",
      icon: ChefHat,
           isNew: false,
      onClick: () => router.push(routes.recipes),
    },
      {
      title: "Modifier Groups",
      icon: Layers,
           isNew: false,
      onClick: () => router.push(routes.modifierGroups),
    },
      {
      title: "Modifiers",
      icon: ListChecks,
           isNew: false,
      onClick: () => router.push(routes.modifiers),
    },
 
  ];

  const filteredLinks = links.filter((link) =>
    link.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
      <div className="space-y-3">
        {/* Title + Search Row */}
        <div className="flex flex-wrap justify-between items-center bg-white dark:bg-neutral-800  p-3 shadow">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
           Production
          </h1>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
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

export default ProductionLandingPage;

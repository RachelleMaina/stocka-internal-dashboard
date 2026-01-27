"use client";

import LinkCard from "@/components/backoffice/LinkCard";
import PageHeader from "@/components/common/PageHeader";
import { Permission } from "@/components/common/Permission";
import { routes } from "@/constants/routes";
import { Boxes, ChefHat, Layers, ListChecks, Package, Scale, Sheet, Search, HandCoins, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ItemsLandingPage = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const links = [
    {
      title: "Catalogue",
      icon: Package,
      onClick: () => router.push(routes.listItems),
    },
    {
      title: "Selling Prices",
      icon: HandCoins,
      onClick: () => router.push(routes.listSellingPrices),
    },
    {
      title: "Units of Measure",
      icon: Scale,
      onClick: () => router.push(routes.listUoms),
    },
    {
      title: "Sale Items",
      icon: Monitor,
      onClick: () => router.push(routes.listSalesItemsSalesChannels),
    },
    // {
    //   title: "Items List",
    //   icon: Package,
    //   onClick: () => router.push(routes.itemsList),
    // },
    // {
    //   title: "Categories",
    //   icon: Boxes,
    //   onClick: () => router.push(routes.categories),
    // },
    // {
    //   title: "Import / Export Excel",
    //   icon: Sheet,
    //   onClick: () => router.push(routes.bulkItems),
    // },
   
  
  ];

  const filteredLinks = links.filter((link) =>
    link.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
    <PageHeader
        title="Items"
        searchValue={search}
        searchOnChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search in items ..."
        searchWidth="w-72"
      />
   

   {filteredLinks.length === 0 ? (
  <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
    <p className="text-lg">No matching options found.</p>
  </div>
) : (
  <div className="flex flex-wrap gap-4 mx-4">
    {filteredLinks.map((card) => (
      <LinkCard key={card.title} {...card} />
    ))}
  </div>
)}
    </div>
  );
};

export default ItemsLandingPage;
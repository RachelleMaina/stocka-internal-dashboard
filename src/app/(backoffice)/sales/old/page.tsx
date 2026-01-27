"use client";

import LinkCard from "@/components/backoffice/LinkCard";
import { Permission } from "@/components/common/Permission";
import { routes } from "@/constants/routes";
import { Boxes, ChefHat, Layers, ListChecks, Package, Scale, Sheet, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ItemsLandingPage = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const links = [
    {
      title: "Sales",
      icon: Users,
      onClick: () => router.push(routes.salesTransactions),
    },
    {
      title: "Items",
      icon: Package,
      onClick: () => router.push(routes.etimsItems),
    },
  {
      title: "Customers",
      icon: Users,
      onClick: () => router.push(routes.etimsCustomers),
    },
   {
      title: "Suppliers",
      icon: Users,
      onClick: () => router.push(routes.etimsSuppliers),
    },
     {
      title: "Purchases",
      icon: Users,
      onClick: () => router.push(routes.etimsPurchases),
    },
     {
      title: "Credit Notes",
      icon: Users,
      onClick: () => router.push(routes.etimsCreditNotes),
    },
         {
      title: "Branches",
      icon: Users,
      onClick: () => router.push(routes.etimsBranches),
    },
             {
      title: "Notices",
      icon: Users,
      onClick: () => router.push(routes.etimsNotices),
    },
              {
      title: "Reverse Invoices",
      icon: Users,
      onClick: () => router.push(routes.etimsReverseInvoices),
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
            Items
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

export default ItemsLandingPage;

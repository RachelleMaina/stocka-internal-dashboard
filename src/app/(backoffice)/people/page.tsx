"use client";

import LinkCard from "@/components/backoffice/LinkCard";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import { routes } from "@/constants/routes";
import { Shield, Users, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";

const PeopleLandingPage = () => {
  const router = useRouter();
  const links = [
    {
      title: "Users",
      icon: Users,
      onClick: () => router.push(routes.staff),
    },
    {
      title: "Roles",
      icon: Shield,
      onClick: () => router.push(routes.roles),
    },
    {
      title: "Customers",
      icon: Users2,
      onClick: () => router.push(routes.customers),
    },
      {
      title: "Suppliers",
      icon: Users2,
      onClick: () => router.push(routes.suppliers),
    },
  ];

  return (
    <div className="h-full">
      <BreadcrumbWithActions
        label="People"
        breadcrumbs={[{ name: "People" }]}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3">
        {links.map((card) => (
          <LinkCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
};

export default PeopleLandingPage;

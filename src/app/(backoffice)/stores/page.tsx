'use client';

import LinkCard from '@/components/backoffice/LinkCard';
import BreadcrumbWithActions from '@/components/common/BreadcrumbWithActions';
import { routes } from '@/constants/routes';
import {
    BarChart3,
    Boxes
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const StoreLandingPage = () => {
const router =useRouter()
    const links = [
        {
          title: 'Store-List',
          description: 'Track daily, weekly, and monthly sales performance.',
          icon: BarChart3,
          onClick: () => router.push(routes.stockLevels)
        },
        {
            title: 'Devices',
            description: 'View stock levels, low stock alerts, and movement history.',
            icon: Boxes,
            onClick: () => router.push(routes.devices)
        },
        // {
        //     title: 'Printers',
        //     description: 'View stock levels, low stock alerts, and movement history.',
        //     icon: Boxes,
        //     onClick: () => router.push(routes.purchases)
        // },
        
        
    ];
    
  return (
      <div className="h-full  bg-white dark:bg-neutral-900">
         <BreadcrumbWithActions
        label="Products"
  breadcrumbs={[
   
    { name: 'Products' },
  ]}
          />
          <div className="p-3">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((card) => (
            <LinkCard key={card.title} {...card} />
        ))}
      </div>
          </div>
          </div>
  );
};

export default StoreLandingPage;

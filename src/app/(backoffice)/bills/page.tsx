'use client';

import PageHeader from '@/components/common/PageHeader';
import { routes } from '@/constants/routes';
import { useSalesChannels } from '@/hooks/useSettings';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';


const SaleItemsEntryPage = () => {
  const router = useRouter();
  const { data: response, isLoading } = useSalesChannels();

  const channels = response?.sales_channels || [];
  const handleChannelClick = (channelId: string, channelName:string) => {
    router.push(`${routes.listBills}?channelName=${encodeURIComponent(channelName)}&channelId=${channelId}`);

  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg">Loading sales channels...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Select  Department"
      />
<div className="mx-4 mt-10">
      {channels.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-neutral-500">
            No department configured yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {channels.map((channel: any) => (
           <div
           key={channel.id}
           onClick={() => handleChannelClick(channel.id, channel.channel_name)}
           className={clsx(
             "bg-white dark:bg-neutral-800",
             "border border-neutral-200 dark:border-neutral-700",
             "rounded-lg",
             "p-6",
             "cursor-pointer",
             "transition-colors",
             "hover:border-primary/40"
           )}
         >
           <div className="flex flex-col gap-5">
         
             {/* Sales channel name */}
             <h3 className="text-lg font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
               {channel.channel_name}
             </h3>
         
             {/* Label / value row */}
             <div className="grid grid-cols-2 gap-6">
         
               {/* Storage */}
               <div>
                 <div className="text-xs font-medium tracking-wide text-neutral-500 dark:text-neutral-400">
                   Storage
                 </div>
                 <div className="mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                   {channel.storage_area_name ?? "—"}
                 </div>
               </div>
         
               {/* Items */}
               <div>
                 <div className="text-xs font-medium tracking-wide text-neutral-500 dark:text-neutral-400">
                   Items
                 </div>
                 <div className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-50 tabular-nums">
                   {channel.total_items ?? 0}
                 </div>
               </div>
         
             </div>
           </div>
         </div>
         
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default SaleItemsEntryPage;
export const SummaryCard=({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) =>{
  return (
<div className="p-2 md:p-3 bg-white dark:bg-neutral-800 flex flex-col md:flex-row items-center gap-2 md:gap-4">
 
  <div className="w-full flex flex-col items-center justify-center gap-2">
    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 leading-tight">
      {title}
    </p>
    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
      {value}
    </p>
  </div>
</div>

  );
}
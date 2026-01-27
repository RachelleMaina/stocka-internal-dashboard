"use client";

interface LinkCardProps {
  title: string;
  icon: React.ElementType;
  onClick: () => void;
  isNew?: boolean;
}

const LinkCard = ({
  title,
  icon: Icon,
  onClick,
  isNew = false,
}: LinkCardProps) => {
  return (
    <div className="relative">
      {isNew && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
          New
        </span>
      )}

      <button
        onClick={onClick}
        className="w-36 h-36 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-md flex flex-col items-center justify-center p-6 transition-all duration-300 hover:bg-primary/5 dark:hover:bg-primary/10 group"
      >
  
        <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
          <Icon className="w-7 h-7 text-primary group-hover:text-primary/90 transition-colors" />
        </div>

     
        <span className="text-sm font-medium text-center text-neutral-900 dark:text-neutral-100 leading-tight line-clamp-2">
          {title}
        </span>
      </button>
    </div>
  );
};

export default LinkCard;
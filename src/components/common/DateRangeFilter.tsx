import React from "react";
import DateTimePicker from "react-datetime-picker";

type DateRangeFilterProps = {
  startDateTime?: Date | null;
  endDateTime?: Date | null;
  setStartDateTime?: (date: Date | null) => void;
  setEndDateTime?: (date: Date | null) => void;
  onApplyDateFilter?: () => void;

};

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDateTime,
  endDateTime,
  setStartDateTime,
  setEndDateTime,
  onApplyDateFilter,

}) => {
  const now = new Date();

  return (
    <div className="flex flex-col gap-1 w-[280px]">
      
      <div className="flex items-center gap-1.5 border border-neutral-400 dark:border-neutral-600 rounded-sm px-2 py-1">
        <DateTimePicker
          value={startDateTime}
          onChange={(date) => {
            setStartDateTime?.(date);
            if (date && endDateTime) onApplyDateFilter?.();
          }}
          format="y-MM-dd HH:mm"
          disableClock
          clearIcon={null}
          calendarIcon={null}
          maxDate={now}
          className="text-xs"
        />
        <span className="text-neutral-500 dark:text-neutral-400">–</span>
        <DateTimePicker
          value={endDateTime}
          onChange={(date) => {
            setEndDateTime?.(date);
            if (date && startDateTime) onApplyDateFilter?.();
          }}
          format="y-MM-dd HH:mm"
          disableClock
          clearIcon={null}
          calendarIcon={null}
          maxDate={now}
          className="text-xs"
        />
      </div>
    </div>
  );
};
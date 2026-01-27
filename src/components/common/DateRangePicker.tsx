import { useEffect, useState } from "react";
import Select from "react-select";

interface DateRangePickerProps {
  onChange: (startDate: string, endDate: string) => void;
  locale?: string;
}

const presetOptions = [
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "CUSTOM", label: "Custom" },
];

const formatDateTimeLocalInput = (date: Date) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16); // yyyy-MM-ddTHH:mm
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onChange,
  locale = "en-GB",
}) => {
  const [preset, setPreset] = useState(presetOptions[0]); // default = Today
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const updateDates = (presetValue: string) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (presetValue) {
      case "TODAY": {
        const today = new Date();
        start = new Date(today.setHours(0, 0, 0, 0));
        end = new Date(today.setHours(23, 59, 59, 999));
        break;
      }
      case "YESTERDAY": {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        start = new Date(y.setHours(0, 0, 0, 0));
        end = new Date(y.setHours(23, 59, 59, 999));
        break;
      }
      case "THIS_WEEK": {
        const d = new Date();
        const day = d.getDay(); // Sunday = 0
        const diff = d.getDate() - day;
        start = new Date(d.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "THIS_MONTH": {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "CUSTOM":
        return;
      default:
        start = new Date();
        end = new Date();
    }

    setStartDate(start);
    setEndDate(end);
    onChange(start.toISOString(), end.toISOString());
  };

  const handleCustomChange = (start: string, end: string) => {
    const startDt = new Date(start);
    const endDt = new Date(end);
    setStartDate(startDt);
    setEndDate(endDt);
    onChange(startDt.toISOString(), endDt.toISOString());
  };

  useEffect(() => {
    updateDates(preset.value);
  }, [preset]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end w-full">
      {/* Preset Select (React Select) */}
      <div className="flex flex-col min-w-[180px] w-full sm:w-auto">
        <label className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">
          Date Range
        </label>
        <Select
          options={presetOptions}
          value={preset}
          onChange={(selected) => setPreset(selected!)}
          className="my-react-select-container text-sm"
                    classNamePrefix="my-react-select"
        />
      </div>

      {/* Date Inputs (only enabled for Custom) */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="flex flex-col w-full sm:w-auto">
          <label className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">
            Start
          </label>
          <input
            type="datetime-local"
            value={formatDateTimeLocalInput(startDate)}
            onChange={(e) =>
              handleCustomChange(e.target.value, endDate.toISOString())
            }
            disabled={preset.value !== "CUSTOM"}
            className="border-2 border-neutral-300 dark:border-neutral-600 rounded text-xs px-2 py-2.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 w-full"
          />
        </div>

        <div className="flex flex-col w-full sm:w-auto">
          <label className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">
            End
          </label>
          <input
            type="datetime-local"
            value={formatDateTimeLocalInput(endDate)}
            onChange={(e) =>
              handleCustomChange(startDate.toISOString(), e.target.value)
            }
            disabled={preset.value !== "CUSTOM"}
            className="border-2 border-neutral-300 dark:border-neutral-600 rounded text-xs px-2 py-2.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;

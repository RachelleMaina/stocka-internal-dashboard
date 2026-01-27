import { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import { User2 } from "lucide-react";

type OptionType = {
  label: string;
  value: string;
};

type CreateAsyncSelectProps = {
  fetchUrl: string;
  value: OptionType | null;
  onChange: (val: OptionType | null) => void;
  onCreate: (inputValue: string) => void;
};

export default function CreateAsyncSelect({
  fetchUrl,
  value,
  onChange,
  onCreate,
}: CreateAsyncSelectProps) {
  const [inputValue, setInputValue] = useState("");

  const loadOptions = async (input: string): Promise<OptionType[]> => {
    try {
      const res = await fetch(`${fetchUrl}?q=${input}`);
      const data = await res.json();

      return data.map((customer: any) => ({
        label: customer.name,
        value: customer.id,
      }));
    } catch (err) {
      console.error("Error fetching customers", err);
      return [];
    }
  };

  return (
    <div className="relative flex items-center w-full max-w-md">
      {/* Icon inside the input */}
      <div className="absolute left-2 pointer-events-none">
        <User2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
      </div>

      <AsyncCreatableSelect
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        onChange={onChange}
        onCreateOption={onCreate}
        value={value}
        inputValue={inputValue}
        onInputChange={(val) => setInputValue(val)}
        placeholder="Search or create customer..."
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: '#d1d5db',
            borderRadius: '0.5rem',
            minHeight: '2.5rem',
            fontSize: '0.875rem',
            paddingLeft: '2rem', // Space for icon
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: '#f3f4f6',
            color: '#111827',
          }),
        }}
        classNames={{
          control: () =>
            'bg-neutral-50 dark:bg-neutral-800 text-sm shadow-sm focus:ring-2 ring-neutral-300 dark:ring-neutral-600',
          input: () => 'text-sm',
          option: () => 'text-sm',
        }}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Save, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReusableTable from '@/components/common/ReusableTable';
import { toast } from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { useSellingPricesSelection, useBulkUpdateItems, useItems, useItemOptions } from '@/hooks/useItems';
import PageHeader from '@/components/common/PageHeader';
import { routes } from '@/constants/routes';
import TableSelectionSummaryBar from '@/components/common/TableSelectionSummaryBar';
import Select from 'react-select';

const COLUMNS = [
  { key: 'brand_name', label: 'Brand Name' },
  { key: 'item_name', label: 'Item Name' },
  { key: 'product_type', label: 'Product Type' },
  { key: 'tax_type', label: 'Tax Type' },
  { key: 'is_purchased', label: 'Purchased' },
  { key: 'is_sold', label: 'Sold' },
  { key: 'is_made_here', label: 'Made Here' },
  { key: 'tracks_stock', label: 'Tracks Stock' },
];

const SELECT_MIN_WIDTH = '180px';

const EditBulkItemsPage = () => {
  const router = useRouter();

  // Search states
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selection state (stores item.id)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setSelectedItemIds([]); // Reset selection on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: itemsResponse, isLoading: loadingItems } = useItems({
    params: {
      limit: 10,
      status: 'active',
      search: debouncedSearch || undefined,
      page: 1,
    },
  });

  const { data: options, isLoading: loadingOptions } = useItemOptions();
  const bulkUpdate = useBulkUpdateItems();

  const items = itemsResponse?.items || [];
  const pagination = itemsResponse?.pagination;

  const { control, handleSubmit, setValue, reset, formState: { isDirty } } = useForm();

  // Auto-populate form when items load
  useEffect(() => {
    if (!items.length || !options) return;

    reset(); // Clear previous form state
    items.forEach((item: any) => {
      const id = item.id;

      setValue(`${id}.brand_name`, item.brand_name || '');
      setValue(`${id}.item_name`, item.item_name || '');

      if (item.product_type_code) {
        const pt = options.productTypes?.find((t: any) => t.code === item.product_type_code);
        if (pt) setValue(`${id}.product_type_select`, { label: pt.name, value: pt.code });
      }

      if (item.tax_type_code) {
        const tt = options.taxTypes?.find((t: any) => t.code === item.tax_type_code);
        if (tt) setValue(`${id}.tax_type_select`, { label: tt.name, value: tt.code });
      }

      setValue(`${id}.is_purchased`, item.is_purchased ?? true);
      setValue(`${id}.is_sold`, item.is_sold ?? true);
      setValue(`${id}.is_made_here`, item.is_made_here ?? false);
      setValue(`${id}.tracks_stock`, item.tracks_stock ?? true);
    });
  }, [items, options, setValue, reset]);

  // Dynamic columns (inputs only show when row is selected)
  const allColumns = useMemo(
    () => COLUMNS.map(col => {
      if (col.key === 'select') {
        return col; // Checkbox handled by ReusableTable
      }

      return {
        ...col,
        render: (row: any) => {
          const itemId = items[row.index]?.id;
          const isSelected = selectedItemIds.includes(itemId);

          if (!isSelected) {
            // Show read-only value when not selected
            switch (col.key) {
              case 'brand_name':
                return <td>{items[row.index]?.brand_name || '--'}</td>;
              case 'item_name':
                return <td>{items[row.index]?.item_name || '--'}</td>;
              case 'product_type':
                return <td>{items[row.index]?.product_type_name || '--'}</td>;
              case 'tax_type':
                return <td>{items[row.index]?.tax_type_name || '--'}</td>;
              case 'is_purchased':
              case 'is_sold':
              case 'is_made_here':
              case 'tracks_stock':
                return (
                  <td className="text-center">
                    {items[row.index]?.[col.key] ? 'Yes' : 'No'}
                  </td>
                );
              default:
                return <td>--</td>;
            }
          }

          // Editable when selected
          switch (col.key) {
            case 'brand_name':
            case 'item_name':
              return (
                <td>
                  <Controller
                    control={control}
                    name={`${itemId}.${col.key}`}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                  />
                </td>
              );

            case 'product_type':
              return (
                <td>
                  <Controller
                    control={control}
                    name={`${itemId}.product_type_select`}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={options?.productTypes?.map((t: any) => ({
                          label: t.name,
                          value: t.code,
                        }))}
                        isSearchable={false}
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                        className="my-react-select-container text-sm"
                        classNamePrefix="my-react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minWidth: SELECT_MIN_WIDTH,
                          }),
                        }}
                        isClearable={false}
                      />
                    )}
                  />
                </td>
              );

            case 'tax_type':
              return (
                <td>
                  <Controller
                    control={control}
                    name={`${itemId}.tax_type_select`}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={options?.taxTypes?.map((t: any) => ({
                          label: t.name,
                          value: t.code,
                        }))}
                        isSearchable={false}
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                        className="my-react-select-container text-sm"
                        classNamePrefix="my-react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minWidth: SELECT_MIN_WIDTH,
                          }),
                        }}
                        isClearable={false}
                      />
                    )}
                  />
                </td>
              );

            case 'is_purchased':
            case 'is_sold':
            case 'is_made_here':
            case 'tracks_stock':
              return (
                <td className="text-center">
                  <Controller
                    control={control}
                    name={`${itemId}.${col.key}`}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="
                        w-4 h-4
                        rounded
                        text-[14px]
                        border-neutral-300 dark:border-neutral-700
                        bg-white dark:bg-neutral-800
                        accent-primary dark:accent-primary/90
                        focus:ring-primary focus:ring-offset-0
                      "
                      />
                    )}
                  />
                </td>
              );

            default:
              return <td>--</td>;
          }
        },
      };
    }),
    [items, control, options, selectedItemIds]
  );

  const tableData = useMemo(() => {
    return items.map((item: any, index: number) => ({
      id: item.id,
      index,
      real_id: item.id,
    }));
  }, [items]);

  const onSubmit = (data: any) => {
    const updatedItems = selectedItemIds.map((itemId) => {
      const formData = data[itemId];
      const originalItem = items.find(i => i.id === itemId);

      return {
        id: itemId,
        brand_name: formData.brand_name?.trim() || originalItem.brand_name,
        item_name: formData.item_name?.trim() || originalItem.item_name,
        product_type_code: formData.product_type_select?.value || originalItem.product_type_code,
        tax_type_code: formData.tax_type_select?.value || originalItem.tax_type_code,
        is_purchased: formData.is_purchased ?? originalItem.is_purchased,
        is_sold: formData.is_sold ?? originalItem.is_sold,
        is_made_here: formData.is_made_here ?? originalItem.is_made_here,
        tracks_stock: formData.tracks_stock ?? originalItem.tracks_stock,
      };
    });

    if (updatedItems.length === 0) {
      toast.success('No items selected');
      return;
    }

    bulkUpdate.mutate(updatedItems, {
      onSuccess: () => {
        toast.success(`${updatedItems.length} items updated successfully!`);
      },
      onError: () => {
        toast.error('Failed to update items');
      },
    });
  };

  // Handle row selection
  const handleRowSelect = (selected: any[]) => {
    setSelectedItemIds(selected.map(row => row.id));
  };

  return (
    <div>
      <PageHeader
        title="Edit Items"
        breadcrumb="Items"
        breadcrumbPath={routes.listItems}
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search items..."
        searchWidth="w-52"
        buttons={[
          {
            label: 'Save Selected',
            icon: Save,
            onClick: handleSubmit(onSubmit),
            variant: 'primary',
            disabled: selectedItemIds.length === 0 || bulkUpdate.isPending,
          },
        ]}
      />

      <div className="mx-4">
        <TableSelectionSummaryBar
          selectedCount={selectedItemIds.length}
          totalAvailable={items.length}
          emptyMessage="Select items to edit"
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ReusableTable
            data={tableData}
            columns={allColumns}
            loading={loadingItems || loadingOptions}
            enableRowSelection={true}
            onRowSelect={handleRowSelect}
            selectedIds={selectedItemIds}
            pagination={pagination}
            
          />
        </form>
      </div>
    </div>
  );
};

export default EditBulkItemsPage;
'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Ban, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useStorageAreas, useCreateStorageArea, useUpdateStorageArea, useToggleStorageArea } from '@/hooks/useSettings'

import toast from 'react-hot-toast';
import clsx from 'clsx';

const TABS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const StorageAreasPage = () => {
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [storageName, setStorageName] = useState('');

  const { data: response, isLoading } = useStorageAreas();
  const createMutation = useCreateStorageArea();
  const updateMutation = useUpdateStorageArea();
  const toggleMutation = useToggleStorageArea();

  const storage_areas = response?.storage_areas || [];

  const filteredAreas = useMemo(() => {
    return storage_areas?.filter((area: any) => {
      if (activeTab === TABS.ACTIVE) return area.is_active;
      if (activeTab === TABS.INACTIVE) return !area.is_active;
      return true;
    });
  }, [storage_areas, activeTab]);

  const openAddModal = () => {
    setEditingArea(null);
    setStorageName('');
    setIsModalOpen(true);
  };

  const openEditModal = (area: any) => {
    setEditingArea(area);
    setStorageName(area.storageName);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArea(null);
    setStorageName('');
  };

  const handleSubmit = () => {
    if (!storageName.trim()) {
      toast.error('Storage storageName is required');
      return;
    }

    if (editingArea) {
      updateMutation.mutate(
        { id: editingArea.id, storageName: storageName.trim() },
        {
          onSuccess: () => {
            toast.success('Storage area updated successfully!');
            closeModal();
          },
          onError: () => toast.error('Failed to update storage area'),
        }
      );
    } else {
      createMutation.mutate(
        [{ storage_name: storageName.trim() }],
        {
          onSuccess: () => {
            toast.success('Storage area created successfully!');
            closeModal();
          },
          onError: () => toast.error('Failed to create storage area'),
        }
      );
    }
  };

  const handleToggle = (area: any) => {
    toggleMutation.mutate(area.id, {
      onSuccess: () => {
        toast.success(`Storage area ${area.is_active ? 'deactivated' : 'activated'}!`);
      },
      onError: () => toast.error('Failed to update status'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg">Loading storage storage_areas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <PageHeader
        title="Storage Areas"
        buttons={[
          {
            label: 'Add Storage Area',
            icon: Plus,
            onClick: openAddModal,
            variant: 'primary',
          },
        ]}
      />

      {/* Tabs */}
      <div className="border-b border-neutral-200 mb-8">
        <div className="flex gap-8">
          {[
            { key: TABS.ALL, label: 'All' },
            { key: TABS.ACTIVE, label: 'Active' },
            { key: TABS.INACTIVE, label: 'Inactive' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                py-3 px-2 border-b-2 font-medium text-sm capitalize transition-colors
                ${activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredAreas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-neutral-500">
            {activeTab === TABS.ALL ? 'No storage storage_areas yet.' : `No ${activeTab} storage storage_areas.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAreas.map((area: any) => (
          <div
            key={area.id}
            className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-semibold text-neutral-900">{area.storage_name}</h3>
      
              {/* Edit Button - Icon + Text */}
              <button
                onClick={() => openEditModal(area)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition"
              >
                <Edit2 size={16} />
                Edit
              </button>
            </div>
      
            <div className="flex items-center justify-between">
              {/* Status Badge */}
              <span
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-full',
                  area.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                )}
              >
                {area.is_active ? 'Active' : 'Inactive'}
              </span>
      
              {/* Activate / Deactivate Button */}
              <button
  onClick={() => handleToggle(area)}
  className={clsx(
    'flex items-center gap-2.5 px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all',
    area.is_active
      ? 'border-red-600 text-red-700 bg-transparent hover:bg-red-50'
      : 'border-green-600 text-green-700 bg-transparent hover:bg-green-50'
  )}
>
  
                {area.is_active ? (
                  <>
                    <Ban size={18} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Activate
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <ConfirmDialog
          title={editingArea ? 'Edit Storage Area' : 'Add Storage Area'}
          message={
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Storage Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storageName}
                  onChange={(e) => setStorageName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Main Warehouse"
                  autoFocus
                />
              </div>
            </div>
          }
          confirmLabel={editingArea ? 'Update' : 'Create'}
          cancelLabel="Cancel"
          onConfirm={handleSubmit}
          onCancel={closeModal}
          destructive={false}
          confirmDisabled={!storageName.trim()}
        />
      )}
    </div>
  );
};

export default StorageAreasPage;
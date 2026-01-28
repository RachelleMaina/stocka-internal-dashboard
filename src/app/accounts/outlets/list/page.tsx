'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, CheckCircle, Ban } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Select from 'react-select';
import { useSalesChannels, useStorageAreas, useCreateSalesChannel, useUpdateSalesChannel, useToggleSalesChannel } from '@/hooks/useSettings';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TABS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const SalesChannelsPage = () => {
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [channelName, setChannelName] = useState('');
  const [selectedStorageArea, setSelectedStorageArea] = useState<any>(null);

  // Fetch data
  const { data: channelsResponse, isLoading: loadingChannels } = useSalesChannels();
  const { data: storageResponse, isLoading: loadingStorage } = useStorageAreas();

  const salesChannels = channelsResponse?.sales_channels || [];
  const storageAreas = storageResponse?.storage_areas || [];

  const createMutation = useCreateSalesChannel();
  const updateMutation = useUpdateSalesChannel();
  const toggleMutation = useToggleSalesChannel();

  const filteredChannels = useMemo(() => {
    return salesChannels.filter((channel: any) => {
      if (activeTab === TABS.ACTIVE) return channel.is_active;
      if (activeTab === TABS.INACTIVE) return !channel.is_active;
      return true;
    });
  }, [salesChannels, activeTab]);

  const storageOptions = storageAreas
    .filter((area: any) => area.is_active)
    .map((area: any) => ({
      value: area.id,
      label: area.storage_name,
    }));

  const openAddModal = () => {
    setEditingChannel(null);
    setChannelName('');
    setSelectedStorageArea(null);
    setIsModalOpen(true);
  };

  const openEditModal = (channel: any) => {
    setEditingChannel(channel);
    setChannelName(channel.channel_name);
    setSelectedStorageArea(
      storageOptions.find((opt: any) => opt.value === channel.storage_area_id) || null
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingChannel(null);
    setChannelName('');
    setSelectedStorageArea(null);
  };

  const handleSubmit = () => {
    if (!channelName.trim()) {
      toast.error('Channel name is required');
      return;
    }
    if (!selectedStorageArea) {
      toast.error('Please select a storage area');
      return;
    }

    const payload = {
      channel_name: channelName.trim(),
      storage_area_id: selectedStorageArea.value,
    };

    if (editingChannel) {
      updateMutation.mutate(
        { id: editingChannel.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Sales channel updated successfully!');
            closeModal();
          },
          onError: () => toast.error('Failed to update sales channel'),
        }
      );
    } else {
      createMutation.mutate([payload], {
        onSuccess: () => {
          toast.success('Sales channel created successfully!');
          closeModal();
        },
        onError: () => toast.error('Failed to create sales channel'),
      });
    }
  };

  const handleToggle = (channel: any) => {
    toggleMutation.mutate(channel.id, {
      onSuccess: () => {
        toast.success(`Sales channel ${channel.is_active ? 'deactivated' : 'activated'}!`);
      },
      onError: () => toast.error('Failed to update status'),
    });
  };

  if (loadingChannels || loadingStorage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg">Loading sales channels...</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <PageHeader
        title="Sales Channels"
        buttons={[
          {
            label: 'Add Sales Channel',
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
      {filteredChannels.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-neutral-500">
            {activeTab === TABS.ALL ? 'No sales channels yet.' : `No ${activeTab} sales channels.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredChannels.map((channel: any) => {
            const storageName =
              storageAreas.find((area: any) => area.id === channel.storage_area_id)?.storage_name ||
              'Unknown';

            return (
              <div
                key={channel.id}
                className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900">{channel.channel_name}</h3>
                    <p className="text-sm text-neutral-600 mt-1">Storage: {storageName}</p>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(channel)}
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
                      channel.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {channel.is_active ? 'Active' : 'Inactive'}
                  </span>

                  {/* Activate/Deactivate Button */}
                  <button
                    onClick={() => handleToggle(channel)}
                    className={clsx(
                      'flex items-center gap-2.5 px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all',
                      channel.is_active
                        ? 'border-red-600 text-red-700 bg-transparent hover:bg-red-50'
                        : 'border-green-600 text-green-700 bg-transparent hover:bg-green-50'
                    )}
                  >
                    {channel.is_active ? (
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
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <ConfirmDialog
          title={editingChannel ? 'Edit Sales Channel' : 'Add Sales Channel'}
          message={
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Channel Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Online Store, Retail Outlet"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Storage Area <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedStorageArea}
                  onChange={setSelectedStorageArea}
                  options={storageOptions}
                  placeholder="Select storage area..."
                  isSearchable={false}
                  menuPlacement="auto"
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (base) => ({
                      ...base,
                      minHeight: '42px',
                      borderColor: '#d1d5db',
                    }),
                  }}
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          }
          confirmLabel={editingChannel ? 'Update' : 'Create'}
          cancelLabel="Cancel"
          onConfirm={handleSubmit}
          onCancel={closeModal}
          destructive={false}
          confirmDisabled={!channelName.trim() || !selectedStorageArea}
        />
      )}
    </div>
  );
};

export default SalesChannelsPage;
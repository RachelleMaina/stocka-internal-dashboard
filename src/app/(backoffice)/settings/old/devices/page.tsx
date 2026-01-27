"use client";

import DeviceForm from "@/components/backoffice/DeviceForm";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageEmptyState from "@/components/common/EmptyPageState";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { endpoints } from "@/constants/endpoints";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { Device } from "@/types/device";
import {
  Copy,
  CopyCheck,
  Edit,
  MonitorSmartphone,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const DeviceCard = ({
  device,
  copiedKey,
  onDelete,
  onEdit,
  onCopy,
}: {
  device: Device;
  copiedKey: string;
  onDelete: (device: Device) => void;
  onEdit: (device: Device) => void;
  onCopy: (key: string | null) => void;
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {device.device_name}
          </h3>
        </div>

        <div className="flex gap-2">
          <Permission resource={"devices"} action={"update"}>
            <button
              onClick={() => onEdit(device)}
              className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              aria-label="Edit"
            >
              <Edit className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>
          </Permission>
          {device.device_role === "pos" && (
            <Permission resource={"devices"} action={"delete"}>
              <button
                onClick={() => onDelete(device)}
                className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                aria-label="Delete"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </Permission>
          )}
        </div>
      </div>

      {/* Device Key + Copy */}
      <div className="flex  items-center gap-2">
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-200 truncate">
          {device.device_key}
        </p>
        <button
          onClick={() => onCopy(device.device_key)}
          className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          aria-label="Copy Key"
        >
          {copiedKey === device.device_key ? (
            <CopyCheck className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          )}
        </button>
      </div>
    </div>
  );
};

const Devices: React.FC = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { backoffice_business_location, active_store_profile } = useAppState();
  const router = useRouter();

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchDevices = async () => {
    try {
      const response = await api.get(endpoints.getDevices);
      const devices = response.data.data;

      setDevices(devices);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleSaveDevice = async (device: { device_name: string }) => {
    setOperationLoading(true);
    if (currentDevice) {
      try {
        await api.patch(endpoints.updateDevice(currentDevice?.id), device);
        toast.success("Device updated.");
        setIsFormOpen(false);
        setCurrentDevice(null); // Reset form and state
        fetchDevices(); // Fetch updated list ofdevices
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to update device."
        );
      } finally {
        setOperationLoading(false);
      }
    } else {
      const payload = {
        device_name: device.device_name,
        business_name: backoffice_business_location?.business_location_name,
      };

      try {
        await api.post(endpoints.createDevice, payload);
        toast.success("Device created.");
        setIsFormOpen(false);
        setCurrentDevice(null); // Reset form and state
        fetchDevices(); // Fetch updated list ofdevices
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to create device."
        );
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const openAddForm = () => {
    setIsFormOpen(true);
  };

  const openEditForm = (device: Device) => {
    setCurrentDevice(device);
    setIsFormOpen(true);
  };

  const openDeleteConfirmation = (device: Device) => {
    setDeviceToDelete(device);
    setIsDeleteOpen(true);
  };

  const handleDeleteDevice = async (id: string) => {
    setOperationLoading(true);
    try {
      await api.patch(endpoints.deactivateDevice(id));
      toast.success("Device deleted.");
      setIsDeleteOpen(false);
      setDeviceToDelete(null);
      fetchDevices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete device.");
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = [
    {
      key: "device_name",
      label: "Device",
      render: (device: Device) => (
        <div className="flex flex-col gap-1">{device.device_name}</div>
      ),
    },

    {
      key: "device_key",
      label: "Device Key",
      render: (device: Device) => (
        <div className="flex items-center gap-2">
          <p className="font-medium text-neutral-900 dark:text-neutral-100 text-left">
            {device.device_key || "-"}
          </p>
          <button
            onClick={() => handleCopy(device.device_key)}
            className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
            aria-label="Copy Key"
          >
            {copiedKey === device.device_key ? (
              <CopyCheck className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            )}
          </button>
        </div>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (device: Device) => {
        return (
          <div className="flex items-center gap-2 justify-end">
            <Permission resource={"devices"} action={"update"}>
              <button
                onClick={() => openEditForm(device)}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
              >
                <Edit className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              </button>
            </Permission>
            {device?.device_role === "pos" && (
              <Permission resource={"devices"} action={"delete"}>
                <button
                  onClick={() => openDeleteConfirmation(device)}
                  className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                >
                  <Trash2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                </button>
              </Permission>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"devices"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Add Device"
          breadcrumbs={[
            { name: "Settings", onClick: () => router.push(routes.settings) },
            { name: "Devices" },
          ]}
          actions={[
            {
              title: "New Device",
              onClick: openAddForm,
              icon: <Plus className="w-4 h-4" />,
              resource: "devices",
              action: "create",
            },
          ]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {devices.length > 0 ? (
            <ReusableTable
              data={devices}
              columns={columns}
              renderCard={(device: Device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  copiedKey={copiedKey}
                  onCopy={() => handleCopy(device.device_key)}
                  onEdit={() => openEditForm(device)}
                  onDelete={() => openDeleteConfirmation(device)}
                />
              )}
            />
          ) : (
            <PageEmptyState
              icon={MonitorSmartphone}
              description="No devices found."
            />
          )}
        </div>
        {isFormOpen && (
          <DeviceForm
            device={currentDevice}
            onSave={handleSaveDevice}
            onClose={() => {
              setIsFormOpen(false);
              setCurrentDevice(null);
            }}
          />
        )}

        {isDeleteOpen && deviceToDelete && (
          <ConfirmDialog
            title="Confirm Deletion"
            message={
              <>
                Are you sure you want to delete the device{" "}
                <strong>{deviceToDelete.device_name}</strong>?
              </>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            destructive
            onConfirm={() => handleDeleteDevice(deviceToDelete.id)}
            onCancel={() => {
              setIsDeleteOpen(false);
              setDeviceToDelete(null);
            }}
          />
        )}
      </div>
    </Permission>
  );
};

export default Devices;

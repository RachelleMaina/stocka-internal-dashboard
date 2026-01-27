"use client";

import LocationForm from "@/components/backoffice/LocationForm";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DropdownMenu } from "@/components/common/DropdownActionMenu";
import PageEmptyState from "@/components/common/EmptyPageState";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { Location } from "@/types/location";
import clsx from "clsx";
import {
  Edit,
  MoreVertical,
  Plus,
  Store,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

function LocationCard({
  location,
  onEdit,
  openStatusChangeConfirmation,
}: {
  location: Location;
  onEdit: () => void;
  openStatusChangeConfirmation: () => void;
  openSetDefaultConfirmation: () => void;
}) {
  // dropdown items
  const dropdownItems = [
    {
      label: location.is_active ? "Deactivate" : "Activate",
      icon: location.is_active ? (
        <ToggleLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
      ) : (
        <ToggleRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
      ),
      onClick: openStatusChangeConfirmation,
      resource: "locations",
      action: "status",
    },
  ];

  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      {/* Header: placeholder + title + status + actions */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-3">
          {/* Name & Status */}
          <div className="flex flex-col gap-1">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">
              {location.store_location_name}
            </h3>
            <span
              className={clsx(
                "text-xs px-2 py-0.5 rounded-full w-fit font-medium",
                location.is_active
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              )}
            >
              {location.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Permission resource="locations" action="update">
            <button
              onClick={onEdit}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </button>
          </Permission>

          <Permission resource="locations" action="update">
            <DropdownMenu
              trigger={
                <button className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition">
                  <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                </button>
              }
              items={dropdownItems}
            />
          </Permission>
        </div>
      </div>

      {/* Badges for storage, POS, default */}
      <div className="flex flex-wrap gap-2">
        {location.is_storage && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
            Stores Stock
          </span>
        )}
        {location.is_pos && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
            Has POS
          </span>
        )}
      </div>
    </div>
  );
}

const Locations: React.FC = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  const [isStatusChangeOpen, setIsStatusChangeOpen] = useState(false);
  const [locationToChangeStatus, setLocationToChangeStatus] =
    useState<any>(null);

  const { active_store_profile } = useAppState();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get(`/api/store-locations/${id}/sections`);
      const locations = response.data.data;
      setLocations(locations);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false); // Set loading to false even on error
    }
  };

  const handleSaveLocation = async (location: Location) => {
    location.parent_store_location_id = id?.[0];

    setOperationLoading(true);
    if (currentLocation) {
      try {
        await api.patch(`/api/store-locations/${currentLocation.id}`, location);
        toast.success("Location updated.");
        setIsFormOpen(false);
        setCurrentLocation(null); // Reset form and state
        fetchLocations(); // Fetch updated list oflocations
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to update location."
        );
      } finally {
        setOperationLoading(false);
      }
    } else {
      try {
        await api.post(`/api/store-locations`, location);
        toast.success("Location created.");
        setIsFormOpen(false);
        setCurrentLocation(null); // Reset form and state
        fetchLocations(); // Fetch updated list oflocations
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to create location."
        );
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const openAddForm = () => {
    setIsFormOpen(true);
  };

  const openEditForm = (location: Location) => {
    setCurrentLocation(location);
    setIsFormOpen(true);
  };

  const openStatusChangeConfirmation = (loc: any) => {
    setLocationToChangeStatus(loc);
    setIsStatusChangeOpen(true);
  };

  const handleLocationStatusChange = async (id: string) => {
    setOperationLoading(true);
    try {
      await api.patch(`/api/store-locations/${id}/status`, {
        is_active: !locationToChangeStatus?.is_active,
      });
      toast.success(
        `Location ${
          locationToChangeStatus?.is_active ? "Deactivated" : "Activated"
        }.`
      );
      setIsStatusChangeOpen(false);
      setLocationToChangeStatus(null);
      fetchLocations();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${
            locationToChangeStatus?.is_active ? "deactivate" : "activate"
          } item.`
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = [
    {
      key: "store_location_name",
      label: "Location",
      render: (loc: Location) => <div>{loc.store_location_name}</div>,
    },
    // {
    //   key: "store_type",
    //   label: "Type",
    //   render: (loc: Location) => (
    //     <span className="capitalize text-sm text-neutral-700 dark:text-neutral-300">
    //       {loc.store_type || "—"}
    //     </span>
    //   ),
    // },
    {
      key: "is_storage",
      label: "Stores Stock",
      render: (loc: Location) => (
        <span className="text-sm">{loc.is_storage ? "Yes" : "No"}</span>
      ),
    },
    {
      key: "is_pos",
      label: "Has POS",
      render: (loc: Location) => (
        <span className="text-sm">{loc.is_pos ? "Yes" : "No"}</span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (loc: Location) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${
            loc.is_active
              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-neutral-100"
              : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-neutral-100"
          }`}
        >
          {loc.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      render: (loc: Location) => {
        const items = [
          {
            label: loc.is_active ? "Deactivate" : "Activate",
            icon: loc.is_active ? (
              <ToggleLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            ) : (
              <ToggleRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            ),
            onClick: () => openStatusChangeConfirmation(loc),
            resource: "location",
            action: "status",
          },
        ];

        return (
          <div className="flex items-center gap-2">
            <Permission resource="locations" action="update">
              <button
                onClick={() => openEditForm(loc)}
                className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              >
                <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              </button>
            </Permission>

            <DropdownMenu
              trigger={
                <button className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition">
                  <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                </button>
              }
              items={items}
            />
          </div>
        );
      },
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"sections"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Add Location"
          breadcrumbs={[
            { name: "Settings", onClick: () => router.push(routes.settings) },
            { name: "Locations", onClick: () => router.push(routes.locations) },
            { name: "Sections" },
          ]}
          actions={[
            {
              title: "New Section",
              onClick: openAddForm,
              icon: <Plus className="w-4 h-4" />,
              disabled: operationLoading,
              resource: "sections",
              action: "create",
            },
          ]}
        />

        <div className="p-3  bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {locations.length > 0 ? (
            <ReusableTable
              data={locations}
              columns={columns}
              renderCard={(location: Location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  onEdit={() => openEditForm(location)}
                  openStatusChangeConfirmation={() =>
                    openStatusChangeConfirmation(location)
                  }
                />
              )}
            />
          ) : (
            <PageEmptyState icon={Store} description="No Sections found." />
          )}
        </div>
        {isFormOpen && (
          <LocationForm
            location={currentLocation}
            onSave={handleSaveLocation}
            store_location_name={active_store_profile?.store_location_name}
            parent_location_id={id}
            onClose={() => {
              setIsFormOpen(false);
              // setCurrentSection(null);
            }}
          />
        )}

        {isStatusChangeOpen && locationToChangeStatus && (
          <ConfirmDialog
            title={locationToChangeStatus.is_active ? "Deactivate" : "Activate"}
            message={
              <>
                Are you sure you want to{" "}
                {locationToChangeStatus.is_active ? "Deactivate" : "Activate"}{" "}
                the location{" "}
                <strong>{locationToChangeStatus.store_location_name}</strong>?
              </>
            }
            confirmLabel={
              locationToChangeStatus.is_active ? "Deactivate" : "Activate"
            }
            cancelLabel="Cancel"
            destructive
            onConfirm={() =>
              handleLocationStatusChange(locationToChangeStatus.id)
            }
            onCancel={() => {
              setIsStatusChangeOpen(false);
              setLocationToChangeStatus(null);
            }}
          />
        )}
      </div>
    </Permission>
  );
};

export default Locations;

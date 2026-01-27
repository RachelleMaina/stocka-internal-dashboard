"use client";

import ChangeUserPasswordModal from "@/components/backoffice/ChangeAuthForm";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DropdownMenu } from "@/components/common/DropdownActionMenu";
import PageEmptyState from "@/components/common/EmptyPageState";
import { FilterBar } from "@/components/common/FilterBar";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { User } from "@/types/user";
import debounce from "lodash.debounce";
import {
  Edit,
  Eye,
  EyeOff,
  Key,
  MoreVertical,
  Phone,
  Plus,
  Shield,
  ToggleLeft,
  ToggleRight,
  User2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const UserCard = ({
  user,
  openStatusChangeConfirmation,
  openChangeAuthForm,
  openEditForm,
}) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: user.color_hex }}
            />
            <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
              {user.first_name} {user.last_name}
            </h3>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap mt-1">
            {/* User Type Badge */}
            <div
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit
          bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
            >
              {user.user_type === "pos" ? <>POS User</> : <>Backoffice User</>}
            </div>

            {/* Status Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${
                user.profile_is_active
                  ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-white"
                  : "bg-red-200 text-red-700 dark:bg-red-700 dark:text-white"
              }`}
            >
              {user.profile_is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!user.is_superadmin && (
          <div className="relative">
            <div className="flex items-center gap-1">
              <Permission resource="users" action="update">
                <button
                  onClick={openEditForm}
                  className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition"
                >
                  <Edit className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                </button>

                <DropdownMenu
                  trigger={
                    <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition">
                      <MoreVertical className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    </div>
                  }
                  items={[
                    {
                      label: user.profile_is_active ? "Deactivate" : "Activate",
                      icon: user.profile_is_active ? (
                        <ToggleLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      ) : (
                        <ToggleRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      ),
                      onClick: openStatusChangeConfirmation,
                      resource: "users",
                      action: "update",
                    },
                    {
                      label:
                        user.user_type === "pos"
                          ? "Change PIN"
                          : "Change Password",
                      icon: (
                        <Key className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      ),
                      onClick: openChangeAuthForm,
                      resource: "users",
                      action: "update",
                    },
                  ]}
                />
              </Permission>
            </div>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="flex flex-wrap gap-4 mt-2">
        {/* Role */}
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1 mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Role
            </span>
          </div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 text-left">
            {user.is_superadmin
              ? "Superadmin"
              : user.role_name || "No Role Assigned"}
          </p>
        </div>

        {/* Phone */}
        {user.phone && (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-1 mb-1">
              <Phone className="w-4 h-4" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Phone
              </span>
            </div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-left">
              {user.phone}
            </p>
          </div>
        )}

        {/* PIN */}
        {user.pin && (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-1 mb-1">
              <Key className="w-4 h-4" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                PIN
              </span>
            </div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100 text-left">
              <MaskedPin pin={user.pin} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const Users: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isStatusChangeOpen, setIsStatusChangeOpen] = useState(false);
  const [userToStatusChange, setUserToStatusChange] = useState<User | null>(
    null
  );
  const [isChangeAuthOpen, setIsChangeAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<any>(null);
  const [status, setStatus] = useState<boolean | null>(true);
  const [userTypeOptions, setUserTypeOptions] = useState<Option[]>([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const router = useRouter();

  const fetchUsers = useCallback(
    async (page: number, search: string) => {
      try {
        const response = await api.get("/api/users", {
          params: {
            status,
            user_type: userType?.value || null,
            search,
            page,
            limit: pagination.limit,
          },
        });
        const { data, pagination: pag, facets } = response?.data?.data;

        setUsers(data);
        setPagination(pag);

        // Update usertype options from facets
        const options = facets.userTypes.map((type: any) => ({
          label: `${type.user_type} (${type.count})`,
          value: type.user_type,
        }));
        setUserTypeOptions(options);

        setLoading(false);
      } catch (error: any) {
        console.log(error);
        setLoading(false);
      }
    },
    [pagination.limit, status, userType?.value]
  );

  // Debounced fetchUsers function
  const debouncedfetchItems = useCallback(
    debounce((page: number, searchTerm: string) => {
      fetchUsers(page, searchTerm);
    }, 300),
    [fetchUsers]
  );

  // useEffect to trigger fetchUsers on relevant changes
  useEffect(() => {
    debouncedfetchItems(currentPage, search);
    return () => {
      debouncedfetchItems.cancel(); // Cancel pending debounced calls on cleanup
    };
  }, [currentPage, debouncedfetchItems, search, status]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search input change
  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm);
    setCurrentPage(1); // Reset to first page on search
    debouncedfetchItems(1, searchTerm);
  };
  const changeAuth = async ({ pin, password }) => {
    if (currentUser) {
      const { id } = currentUser;
      try {
        if (pin) {
          await api.patch(`/api/users/${id}/profiles/change-pin`, { pin });
          toast.success("PIN changed successfully");
          setIsChangeAuthOpen(false);
          setCurrentUser(null);
        } else if (password) {
          await api.patch(`/api/users/${id}/profiles/change-password`, {
            password,
          });
          toast.success("Password changed successfully");
          setIsChangeAuthOpen(false);
          setCurrentUser(null);
        } else {
          toast.error("Invalid data provided");
        }
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to update credentials"
        );
      }
    }
  };

  const openAddForm = () => {
    router.push(routes.staffForm);
  };

  const openEditForm = (user: User) => {
    router.push(`${routes.staffForm}/${user.id}`);
  };

  const openChangeAuthForm = (user: User) => {
    setCurrentUser(user);
    setIsChangeAuthOpen(true);
  };

  const openStatusChangeConfirmation = (user: User) => {
    setUserToStatusChange(user);
    setIsStatusChangeOpen(true);
  };

  const handleStatusChangeUser = async (id: string) => {
    setOperationLoading(true);
    try {
      await api.patch(`/api/users/${id}/profiles/status`, {
        is_active: !userToStatusChange?.profile_is_active,
      });
      toast.success(
        `User ${
          userToStatusChange?.profile_is_active ? "Deactivated" : "Activated"
        }.`
      );
      setIsStatusChangeOpen(false);
      setUserToStatusChange(null);
      fetchUsers(1, "");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${
            userToStatusChange?.profile_is_active ? "deactivate" : "activate"
          } user.`
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const columns = [
    {
      key: "user_identity",
      label: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full shrink-0"
            style={{ backgroundColor: user.color_hex }}
          />
          <div className="flex flex-col text-xs text-neutral-800 dark:text-neutral-100">
            <p className="font-medium truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              ({user.display_name})
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (user) => (
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-200 truncate">
            <Phone className="w-4 h-4 shrink-0 text-neutral-400" />
            <span>{user.phone || "N/A"}</span>
          </div>
          <div
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit
          bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
          >
            {user.user_type === "pos" ? <>POS User</> : <>Backoffice User</>}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (user) => (
        <div className="text-xs text-neutral-700 dark:text-neutral-100">
          <p className="truncate">
            {user.is_superadmin
              ? "Superadmin"
              : user.role_name || "No Role Assigned"}
          </p>
        </div>
      ),
    },
    {
      key: "locations",
      label: "Stores",
      render: (user) => (
        <div className="text-xs text-neutral-700 dark:text-neutral-100">
          <p className="truncate">
            {user?.store_locations
              ?.map((item) => item.store_location_name)
              .join(", ") || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "user_pin",
      label: "PIN",
      render: (user) => <MaskedPin pin={user.pin} />,
    },
    {
      key: "profile_is_active",
      label: "Status",
      render: (user) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${
            user.profile_is_active
              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-neutral-100"
              : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-neutral-100"
          }`}
        >
          {user.profile_is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (user) => (
        <div className="flex items-center justify-end gap-3">
          {!user.is_superadmin && (
            <>
              <Permission resource="users" action="update">
                <button
                  onClick={() => openEditForm(user)}
                  className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition"
                >
                  <Edit className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                </button>

                <DropdownMenu
                  trigger={
                    <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition">
                      <MoreVertical className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    </div>
                  }
                  items={[
                    {
                      label: user.profile_is_active ? "Deactivate" : "Activate",
                      icon: user.profile_is_active ? (
                        <ToggleLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      ) : (
                        <ToggleRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      ),
                      onClick: () => openStatusChangeConfirmation(user),
                      resource: "users",
                      action: "update",
                    },
                    {
                      label:
                        user.user_type === "pos"
                          ? "Change PIN"
                          : "Change Password",
                      icon: (
                        <Key className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      ),
                      onClick: () => openChangeAuthForm(user),
                      resource: "users",
                      action: "update",
                    },
                  ]}
                />
              </Permission>
            </>
          )}
        </div>
      ),
    },
  ];
  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"users"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Add User"
          breadcrumbs={[
            { name: "People", onClick: () => router.push(routes.people) },
            { name: "Users" },
          ]}
          actions={[
            {
              title: "New User",
              icon: <Plus className="w-4 h-4" />,
              onClick: openAddForm,
              resource: "users",
              action: "create",
            },
          ]}
          filters={
            <FilterBar
              isActive={status}
              onToggleActive={(value) => setStatus(value)}
              searchQuery={search}
              onSearchChange={handleSearchChange}
              facets={[
                {
                  label: "User Type",
                  options: userTypeOptions,
                  value: userType,
                  onChange: (value) => {
                    setUserType(value);
                    setPagination((prev) => ({ ...prev, current_page: 1 }));
                  },
                },
              ]}
            />
          }
        />
        <div className="p-3  bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {users?.length > 0 ? (
            <>
              <ReusableTable
                data={users}
                columns={columns}
                pageSize={pagination.limit}
                pagination={{ ...pagination, currentPage }}
                onPageChange={handlePageChange}
                renderCard={(user: User) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    openStatusChangeConfirmation={() =>
                      openStatusChangeConfirmation(user)
                    }
                    openChangeAuthForm={() => openChangeAuthForm(user)}
                    openEditForm={() => openEditForm(user)}
                  />
                )}
              />
            </>
          ) : (
            <PageEmptyState icon={User2} description="No users found." />
          )}
        </div>
        {/* Form Modal */}
        {isChangeAuthOpen && currentUser && (
          <ChangeUserPasswordModal
            userType={currentUser.user_type}
            loading={operationLoading}
            onSave={changeAuth}
            onClose={() => setIsChangeAuthOpen(false)}
          />
        )}

        {isStatusChangeOpen && userToStatusChange && (
          <ConfirmDialog
            title={
              userToStatusChange.profile_is_active ? "Deactivate" : "Activate"
            }
            message={
              <>
                Are you sure you want to{" "}
                {userToStatusChange.profile_is_active
                  ? "Deactivate"
                  : "Activate"}{" "}
                the user{" "}
                <strong>
                  {userToStatusChange.first_name} {userToStatusChange.last_name}
                </strong>
                ?
              </>
            }
            confirmLabel={
              userToStatusChange.profile_is_active ? "Deactivate" : "Activate"
            }
            cancelLabel="Cancel"
            destructive
            onConfirm={() => handleStatusChangeUser(userToStatusChange.id)}
            onCancel={() => {
              setIsStatusChangeOpen(false);
              setUserToStatusChange(null);
            }}
          />
        )}
      </div>
    </Permission>
  );
};

const MaskedPin = ({ pin }: { pin: string | null }) => {
  const [visible, setVisible] = useState(false);

  if (!pin) return <span>-</span>;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono tracking-widest">
        {visible ? pin : "••••"}
      </span>
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

export default Users;

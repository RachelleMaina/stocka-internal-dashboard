"use client";

import CategoryForm from "@/components/backoffice/CategoryForm";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageEmptyState from "@/components/common/EmptyPageState";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { Category } from "@/types/category";
import { Edit, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: category.color_hex }}
          />
          <div>
            <p className="text font-semibold text-neutral-700 dark:text-neutral-300">
              {category.category_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Permission resource={"categories"} action={"update"}>
          <button
            onClick={() => onEdit(category)}
            className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            aria-label="Edit"
          >
            <Edit className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>
            </Permission>
          <Permission resource={"categories"} action={"delete"}>
          <button
            onClick={() => onDelete(category)}
            className="p-2 rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            aria-label="Delete"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            </button>
            </Permission>
        </div>
      </div>
    </div>
  );
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/categories");
      const categories = response.data.data;
      setCategories(categories);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleSaveCategory = async (category: Category) => {
    setOperationLoading(true);

    if (category.id && typeof category.id === "string") {
      try {
        await api.patch(`/api/categories/${category.id}`, category);
        setIsFormOpen(false);
        setCurrentCategory(null);
        toast.success("Category updated.");
        fetchCategories();
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to update category"
        );
      } finally {
        setOperationLoading(false);
      }
    } else {
      try {
        await api.post("/api/categories", category);
        toast.success("Category created.");
        setIsFormOpen(false);
        setCurrentCategory(null);
        fetchCategories();
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to create category"
        );
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setOperationLoading(true);
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success("Category deleted.");
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete category"
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const openAddForm = () => {
    setCurrentCategory({
      id: "",
      category_name: "",
      color_hex: "#A78BFA",
      parent_category_id: null,
      sort_order: 0,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setCurrentCategory(category);
    setIsFormOpen(true);
  };

  const openDeleteConfirmation = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  };

  const columns = [
    {
      key: "name_with_color",
      label: "Category",
      render: (cat: Category) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: cat.color_hex }}
          />
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {cat.category_name}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (category: Category) => {
        return (
          <div className="flex items-center gap-3 ">
            <Permission resource={"categories"} action={"update"}>
              <button
                onClick={() => openEditForm(category)}
                       className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition"
              >
                <Edit className="w-4 h-4" />
             
              </button>
            </Permission>
            <Permission resource={"categories"} action={"delete"}>
              {" "}
              <button
                onClick={() => openDeleteConfirmation(category)}
                           className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-700  text-neutral-700 dark:text-neutral-300 transition">
                <Trash2 className="w-4 h-4 text-red-600" /> 
              </button>
            </Permission>
          </div>
        );
      },
    },
  ];
  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"categories"} action={"read"} isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="New Category"
          breadcrumbs={[
            { name: "Products", onClick: () => router.push(routes.items) },
            { name: "Categories" },
          ]}
          actions={[
            {
              title: "New Category",
              icon: <Plus  className="w-4 h-4"/>,
              onClick: openAddForm,
              resource: "categories",
              action: "read",
            },
          ]}
        />

        <div className="p-3  bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {categories.length > 0 ? (
            <ReusableTable
              data={categories}
              columns={columns}
              searchKey="category_name"
              pageSize={10}
              enableSearch={true}
              usePagination={true}
              loading={loading}
              renderCard={(cat: Category) => (
                <CategoryCard
                  category={cat}
                  onEdit={openEditForm}
                  onDelete={openDeleteConfirmation}
                />
              )}
            />
          ) : (
            <PageEmptyState icon={Package} description="No categories found." />
          )}
        </div>

        {isFormOpen && currentCategory && (
          <CategoryForm
            category={currentCategory}
            onSave={handleSaveCategory}
            onClose={() => {
              setIsFormOpen(false);
              setCurrentCategory(null);
            }}
            loading={operationLoading}
          />
        )}

        {isDeleteOpen && categoryToDelete && (
          <ConfirmDialog
            title="Confirm Deletion"
            message={
              <>
                Are you sure you want to delete the category{" "}
                <strong>{categoryToDelete.category_name}</strong>?
              </>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            destructive
            onConfirm={() => handleDeleteCategory(categoryToDelete.id)}
            onCancel={() => {
              setIsDeleteOpen(false);
              setCategoryToDelete(null);
            }}
          />
        )}
      </div>
    </Permission>
  );
};

export default Categories;

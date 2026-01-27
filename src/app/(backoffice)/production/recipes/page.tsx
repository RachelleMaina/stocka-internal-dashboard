"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import PageEmptyState from "@/components/common/EmptyPageState";

import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { GlassWater, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface RecipeItem {
  item_id: string;
  item_name: string;
  yield_qty: string;
  quantity_units: { code_name: string; value: number };
  has_recipe: boolean;
}

const RecipeCard = ({ item, router }: { item: RecipeItem; router: any }) => {
  return (
    <div className="bg-white border border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start gap-2">
        <h3 className="text font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
          {item.item_name}
        </h3>

        {item.has_recipe ? (
          <Permission resource="recipes" action="update">
            <button
              type="button"
              onClick={() => router.push(`${routes.recipesForm}/${item.id}`)}
              className="px-4 py-1.5 border border-primary rounded text-primary text-sm font-semibold"
            >
              View Recipe
            </button>
          </Permission>
        ) : (
          <Permission resource="recipes" action="create">
            <button
              type="button"
              onClick={() => router.push(`${routes.recipesForm}/${item.id}`)}
              className="px-4 py-1.5  bg-primary rounded text-white text-sm font-semibold"
            >
              Add Recipe
            </button>
          </Permission>
        )}
      </div>
    </div>
  );
};

const Recipes: React.FC = () => {
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { backoffice_business_location } = useAppState();

  const router = useRouter();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await api.get(endpoints.getRecipes);
      const recipes = response.data.data;
      setItems(recipes);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "item_name",
      label: "Item",
      render: (item: RecipeItem) => (
        <div className="flex flex-col gap-1">{item.item_name}</div>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      render: (item: RecipeItem) =>
        item.has_recipe ? (
          <Permission resource="recipes" action="update">
            <button
              type="button"
              onClick={() => router.push(`${routes.recipesForm}/${item.id}`)}
              className="px-4 py-1.5 border border-primary rounded text-primary text-sm font-semibold"
            >
              View Recipe
            </button>
          </Permission>
        ) : (
          <Permission resource="recipes" action="create">
            <button
              type="button"
              onClick={() => router.push(`${routes.recipesForm}/${item.id}`)}
              className="px-4 py-1.5  bg-primary rounded text-white text-sm font-semibold"
            >
              Add Recipe
            </button>
          </Permission>
        ),
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource="recipes" action="read" isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Add Recipe"
          breadcrumbs={[
            {
              name: "Production",
              onClick: () => router.push(routes.production),
            },

            { name: "Recipes" },
          ]}
          actions={[
            {
              title: "New Recipe",
              onClick: () => router.push(`${routes.recipesForm}`),
              icon: <Plus className="w-4 h-4" />,
              resource: "recipes",
              action: "create",
            },
          ]}
        />

        <div className="p-3 shadow bg-neutral-100 md:bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
          {items.length > 0 ? (
            <ReusableTable
              data={items}
              columns={columns}
              renderCard={(item: RecipeItem) => (
                <RecipeCard key={item.item_id} item={item} router={router} />
              )}
            />
          ) : (
            <PageEmptyState
              icon={GlassWater}
              description="No recipe-eligible items found."
            />
          )}
        </div>
      </div>
    </Permission>
  );
};

export default Recipes;

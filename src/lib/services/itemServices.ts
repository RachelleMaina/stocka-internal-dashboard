import db from "./db";
interface UICategory {
  id: string;
  name: string;
  color: string;
}

interface UIItem {
  id: string;
  name: string;
  price: number;
  category?: UICategory | null;
  department: string; // Maps to store_location_name
  hasVariants?: boolean; // Add default or handle in UI
  variants?: any[]; // Adjust based on your schema
  modifierGroups?: any[]; // Adjust based on your schema
}

interface PosData {
  items: UIItem[];
  storeLocations: StoreLocation[];
  departments: string[];
  categories: UICategory[];
}

// List all items, sorted by item_name
export const listItemsService = async (search = "") => {
  let result;
  const q = search.trim();
  if (!q) {
    result = await db.items.orderBy("item_name").toArray();
  } else {
    result = await db.items
      .orderBy("item_name")
      .filter((item) =>
        item.item_name.toLowerCase().includes(search.toLowerCase())
      )
      .toArray();
  }

  if (result.length === 0) {
    return { success: false, data: [], message: "No items found" };
  }

  return { success: true, data: result };
};


// export const fetchAllItemsService = async () => {
//   try {
//     const result = await db.items.orderBy("item_name").toArray();

//     if (result.length === 0) {
//       return {
//         success: false,
//         data: [],
//         message: "No items found in the database",
//       };
//     }

//     // Map items to the expected Item type
//     const items = result.map((item) => ({
//       id: item.id,
//       name: item.item_name,
//       price: item.selling_price,
//       category: item.category_name
//         ? {
//             id: `cat-${item.id}`,
//             name: item.category_name,
//             color: generateCategoryColor(item.category_name),
//           }
//         : null,
//       department: item.department || 'General',
//       hasVariants: !!item.variants && item.variants.length > 0,
//       variants: item.variants
//         ? item.variants.map((v: any) => ({
//             id: v.id,
//             name: v.name,
//             priceImpact: v.price_impact || 0,
//           }))
//         : [],
//       modifierGroups: item.modifier_groups
//         ? item.modifier_groups.map((mg: any) => ({
//             id: mg.id,
//             name: mg.name,
//             singleSelect: mg.single_select || false,
//             minSelections: mg.min_selections || 0,
//             maxSelections: mg.max_selections || 0,
//             modifiers: mg.modifiers.map((m: any) => ({
//               id: m.id,
//               name: m.name,
//               priceImpact: m.price_impact || 0,
//               quantity: 1,
//             })),
//           }))
//         : [],
//     }));

//     return {
//       success: true,
//       data: items,
//     };
//   } catch (error) {
//     console.error('Error fetching items:', error);
//     return {
//       success: false,
//       data: [],
//       message: "Failed to fetch items",
//     };
//   }
// };

// Helper function to generate category color


export const fetchAllItemsService = async () => {
  try {
    const result = await db.items.orderBy("item_name").toArray();

    if (result.length === 0) {
      return {
        success: false,
        data: [],
        message: "No items found in the database",
      };
    }

   

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching items:", error);
    return {
      success: false,
      data: [],
      message: "Failed to fetch items",
    };
  }
};



export const getPOSDataFromDB = async (store_location_id: string | null) => {
  try {
    return await db.transaction('r', [db.store_locations, db.menu], async () => {
      // Fetch store locations (departments)
      const storeLocations = await db.store_locations.toArray();
      const departments = storeLocations.map((loc) => ({
        id: loc.id,
        name: loc.store_location_name,
      }));

      // Fetch menu for the specified store location (if provided)
      let menu = { categories: [], items: [] };
      if (store_location_id) {
        const menuData = await db.menu.get(store_location_id);
   
        if (menuData?.categories) {
          const items = menuData.categories.flatMap((cat) =>
            cat.items.map((item) => ({
              ...item,
              category: { id: cat.id, name: cat.name, color: cat.color },
              hasVariants: item.hasVariants || false,
              variants: item.variants || [],
              modifierGroups: item.modifierGroups || [],
            }))
          );

          menu = {
            categories: menuData.categories,
            items,
          };
       
          
        } else {
          console.warn(`No menu found for store_location_id: ${store_location_id}`);
        }
      }

      return { departments, menu };
    });
  } catch (error) {
    console.error('Error fetching POS data from DB:', error);
    return { departments: [], menu: { categories: [], items: [] } };
  }
};


// Search items by name (partial match)
export const searchItemsByNameService = async (searchTerm: string) => {
  if (!searchTerm?.trim()) {
    return { success: false, data: [], message: "Please enter a search term" };
  }

  const result = await db.items
    .orderBy("item_name")
    .filter((item) =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .toArray();

  if (result.length === 0) {
    return {
      success: false,
      data: [],
      message: `No active items found for "${searchTerm}"`,
    };
  }

  return { success: true, data: result };
};

// Search items by barcode (exact match)
export const searchItemsByBarcodeService = async (barcode: string) => {
  if (!barcode?.trim()) {
    return { success: false, data: [], message: "Please enter a barcode" };
  }

  const result = await db.items
    .where({ barcode: barcode.trim(), is_active: true })
    .toArray(); // Uses barcode index

  if (result.length === 0) {
    return {
      success: false,
      data: [],
      message: "No active items found with this barcode",
    };
  }

  return { success: true, data: result };
};

// Search items by SKU or product code (exact match)
export const searchItemsBySkuOrProductCodeService = async (
  searchValue: string
) => {
  if (!searchValue?.trim()) {
    return {
      success: false,
      data: [],
      message: "Please enter an SKU or product code",
    };
  }

  const trimmedValue = searchValue.trim();
  const result = await db.items
    .where("sku")
    .equals(trimmedValue)
    .or("product_code")
    .equals(trimmedValue)
    .and((item) => item.is_active)
    .toArray(); // Uses sku and product_code indexes

  if (result.length === 0) {
    return {
      success: false,
      data: [],
      message: `No active items found for SKU or product code "${trimmedValue}"`,
    };
  }

  return { success: true, data: result };
};

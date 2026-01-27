type PermissionCheckOptions = {
  resource: string;
  action: string;
  isSuperadmin?: boolean;
};

export function formatNumber(input: any): string {
  
    const number = parseFloat(input);
    
    if (isNaN(number)) {
     return input
    }
  
    // Round the number to an integer (removes decimals) and format with thousands separators
    // const integerPart = Math.round(number); // Rounds to nearest integer
    return number.toLocaleString(); // Format with thousands separators
}
  

export const formatDate = (isoString:string) => {
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleString('en-KE', { month: 'short' });
  const year = date.getFullYear();
  const ordinalDay = `${day}`;

  return `${ordinalDay} ${month} ${year}`;
};



// export function hasPermission(
//   permissions: string[],
//   { resource, action, isSuperadmin = false }: PermissionCheckOptions
// ): boolean {
//   if (isSuperadmin) return true;

//   const permission = `${resource}:${action}`;

//   return permissions.includes(permission);
// }
  

export function hasPermission(
  permissions: string[],
  { resource, action, isSuperadmin = false }: PermissionCheckOptions
): boolean {
  if (isSuperadmin) return true;

  const required = `${resource}:${action}`;

  return permissions.includes(required) || permissions.some((p) => p.endsWith(`:${required}`));
}

export function generateColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  return hslToHex(hue, 50, 40);
}

export function generateDisplayName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  return `${first} ${last}`.trim();
}

export function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function generateRandomPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function generateTransactionNumber() {
  const now = new Date();

  const year = now.getFullYear().toString().slice(-2); // last 2 digits of year
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 01–12
  const day = String(now.getDate()).padStart(2, "0"); // 01–31
  const hours = String(now.getHours()).padStart(2, "0"); // 00–23
  const minutes = String(now.getMinutes()).padStart(2, "0"); // 00–59
  const seconds = String(now.getSeconds()).padStart(2, "0"); // 00–59

  return `${year}${month}${day}${hours}${minutes}${seconds}${now.getMilliseconds()}`;
}

type UomLike = {
  brand_name?: string;
  item_name?: string;
  uom_display_name?: string;
  child_quantity_in_packaging?: number;
  uom_child_display_name?: string;
};

export function getItemName(uom: UomLike): string {
  if (!uom) return "";
  const {
    brand_name = "",
    item_name = "",
    uom_display_name = "",
    child_quantity_in_packaging = 0,
    uom_child_display_name = "",
  } = uom;
  const qtySuffix =
    child_quantity_in_packaging > 1 && uom_child_display_name
      ? ` * ${child_quantity_in_packaging} ${uom_child_display_name}s`
      : "";

  return `${brand_name || ""} ${item_name} ${uom_display_name}${qtySuffix}`.trim();
}

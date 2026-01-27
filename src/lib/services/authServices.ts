import db from './db';

// Login with PIN
export const posLogin = async (pin: string ) => {
  if (!pin?.trim()) {
    return { success: false, message: 'PIN is required' };
  }

  const user = await db.users
  .filter(
    (u) =>
      u.profile?.pin === pin
  )
  .first();


  if (!user) {
    return { success: false, message: 'Invalid PIN.' };
  }

  const pos_user_profile = {
    user_id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    email: user.email,
    is_superadmin:user.is_superadmin,
    display_name: user.profile?.display_name || null,
    color_hex: user.profile?.color_hex || user.color_hex || null,
    business_location_id: user.profile?.business_location_id || null,
    store_locations: user.profile?.store_locations,
    user_type: user.profile?.user_type || null,
    role: user.role
      ? {
          role_name: user.role.role_name,
          permissions: user.role.permissions,
        }
      : null,
  };

  return { success: true, data: pos_user_profile };
};

// Logout (clear session data, if needed)
export const posLogout = async () => {
  localStorage.removeItem('pos_user_profile');

  return { success: true, message: 'Logged out' };
};
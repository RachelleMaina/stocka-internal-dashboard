import db from "./db";

export interface User {
  id: string;
  user_name: string;
  phone: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export const getUsersService = async (): Promise<{
  success: boolean;
  users: User[];
  message: string;
}> => {
  try {
    const users = await db.users.toArray();
    
    // Filter for active users only
    const activeUsers = users.filter(user => user.is_active);
    
    // Sort by user_name (A-Z)
    const sortedUsers = activeUsers.sort((a, b) => 
      a.user_name.localeCompare(b.user_name)
    );

    return {
      success: true,
      users: sortedUsers,
      message: "Users fetched successfully",
    };
  } catch (error) {
    console.error(`Error in getUsersService: ${error.message}`);
    return {
      success: false,
      users: [],
      message: `Failed to fetch users: ${error.message}`,
    };
  }
};

// Optional: Get all users including inactive ones
export const getAllUsersService = async (): Promise<{
  success: boolean;
  users: User[];
  message: string;
}> => {
  try {
    const users = await db.users.toArray();
    
    // Sort by user_name (A-Z)
    const sortedUsers = users.sort((a, b) => 
      a.user_name.localeCompare(b.user_name)
    );

    return {
      success: true,
      users: sortedUsers,
      message: "All users fetched successfully",
    };
  } catch (error) {
    console.error(`Error in getAllUsersService: ${error.message}`);
    return {
      success: false,
      users: [],
      message: `Failed to fetch all users: ${error.message}`,
    };
  }
};

// Optional: Get user by ID
export const getUserByIdService = async (
  userId: string
): Promise<{
  success: boolean;
  user: User | null;
  message: string;
}> => {
  try {
    if (!userId) {
      return {
        success: false,
        user: null,
        message: "User ID is required",
      };
    }

    const user = await db.users.get(userId);
    
    if (!user) {
      return {
        success: false,
        user: null,
        message: "User not found",
      };
    }

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        user: null,
        message: "User is inactive",
      };
    }

    return {
      success: true,
      user,
      message: "User fetched successfully",
    };
  } catch (error) {
    console.error(`Error in getUserByIdService: ${error.message}`);
    return {
      success: false,
      user: null,
      message: `Failed to fetch user: ${error.message}`,
    };
  }
};

// Optional: Search users by name or phone
export const searchUsersService = async (
  query: string
): Promise<{
  success: boolean;
  users: User[];
  message: string;
}> => {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        users: [],
        message: "Query too short",
      };
    }

    const searchTerm = query.trim().toLowerCase();
    
    const users = await db.users
      .filter(user => 
        user.is_active && 
        (user.user_name.toLowerCase().includes(searchTerm) ||
         (user.phone && user.phone.toLowerCase().includes(searchTerm)) ||
         (user.email && user.email.toLowerCase().includes(searchTerm)))
      )
      .toArray();

    return {
      success: true,
      users,
      message: `${users.length} users found`,
    };
  } catch (error) {
    console.error(`Error in searchUsersService: ${error.message}`);
    return {
      success: false,
      users: [],
      message: `Failed to search users: ${error.message}`,
    };
  }
};
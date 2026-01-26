import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { supabaseServer } from "../../db/supabaseServer.js";
import { constructEmail } from "../../utils/helpers.js";




 //////////////////// admin management with the supabase (web-2) ///////////////////////////
/**
 * Register Admin
 * Role is set to 'admin' in backend
 */
export const registerAdminCredentials = async (req, res) => {
  try {
    const {name, username, password } = req.body;

    // Basic validation
    if (!name || !username || !password) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Missing required fields: name, username and password")
        );
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Password must be at least 6 characters long")
        );
    }

    // Basic username validation
    if (!username || username.trim().length === 0) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Username cannot be empty")
        );
    }
    // Basic name validation
    if (!name || name.trim().length === 0) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "name cannot be empty")
        );
    }

    // Check if admin already exists by username
    const { data: existingUser, error: userQueryError } = await supabaseServer
      .from("auth")
      .select("id, username, role, auth_id")
      .eq("username", username)
      .single();

    if (userQueryError && userQueryError.code !== "PGRST116") {
      console.error("Database query error:", userQueryError);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Database error occurred: ${userQueryError}`)
        );
    }

    // Check if user exists
    if (existingUser) {
      return res
        .status(HttpStatusCode.CONFLICT)
        .json(
          new ApiError(HttpStatusCode.CONFLICT, `Username already registered`)
        );
    }

    // User doesn't exist in our database - check Supabase auth
    const fullEmail = constructEmail(username);
    
    // First check if this email already exists in Supabase auth
    const { data: { users }, error: listError } = await supabaseServer.auth.admin.listUsers();
    const existingAuthUser = users?.find(u => u.email === fullEmail);
    
    if (existingAuthUser) {
      console.log("Found existing Supabase auth user, deleting:", fullEmail);
      // Delete the existing auth user to allow re-registration
      await supabaseServer.auth.admin.deleteUser(existingAuthUser.id);
    }
    
    // Create new Supabase auth user
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: fullEmail,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        username: username,
        role: "admin"
      }
    });

    if (authError) {
      console.error("Supabase auth error:", authError);
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, authError.message));
    }

    if (!authData.user) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to create user")
        );
    }

    // Insert user into auth table with auth_id and role
    const { error: insertError } = await supabaseServer
      .from("auth")
      .insert({
        auth_id: authData.user.id,
        name:name,
        username: username,
        email: null, // Admin login with username
        role: "admin"
      });

    if (insertError) {
      console.error("Auth table insert error:", insertError);

      // Cleanup: Delete Supabase auth user
      try {
        await supabaseServer.auth.admin.deleteUser(authData.user.id);
        console.log("Cleaned up auth user due to table insert failure");
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError);
      }

      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Registration failed. Please try again")
        );
    }

    // Success response
    return res.status(HttpStatusCode.CREATED).json(
      new ApiResponse(HttpStatusCode.CREATED, {
        message: "Registration successful",
        user: {
          id: authData.user.id,
          name: name,
          username: username,
          role: "admin"
        }
      })
    );
  } catch (error) {
    console.error("Unexpected registration error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Registration failed. Please try again")
      );
  }
};


/**
 * Get all admins
 */
export const getAllAdmins = async (req, res) => {
  try {
    const { data: admins, error } = await supabaseServer
      .from("auth")
      .select("id, name, username, auth_id, role, created_at")
      .eq("role", "admin");

    if (error) {
      console.error("Database query error:", error);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to fetch admins")
        );
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(HttpStatusCode.OK, {
        admins: admins || []
      })
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to fetch admins")
      );
  }
};



/**
 * Register Club Admin
 * Role is set to 'club.admin' in backend
 */
export const registerClubAdmin = async (req, res) => {
  try {
    const {name, username, password } = req.body;

    // Basic validation
    if (!name || !username || !password) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Missing required fields")
        );
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Password must be at least 6 characters long")
        );
    }

    // Basic username validation
    if (!username || username.trim().length === 0) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Username cannot be empty")
        );
    }
    // Basic name validation
    if (!name || name.trim().length === 0) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "name cannot be empty")
        );
    }

    // Check if club.admin already exists by username
    const { data: existingUser, error: userQueryError } = await supabaseServer
      .from("auth")
      .select("id, username, role, auth_id")
      .eq("username", username)
      .single();

    if (userQueryError && userQueryError.code !== "PGRST116") {
      console.error("Database query error:", userQueryError);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Database error occurred: ${userQueryError}`)
        );
    }

    // Check if user exists
    if (existingUser) {
      return res
        .status(HttpStatusCode.CONFLICT)
        .json(
          new ApiError(HttpStatusCode.CONFLICT, `Username already registered`)
        );
    }

    // User doesn't exist in our database - check Supabase auth
    const fullEmail = constructEmail(username);
    
    // First check if this email already exists in Supabase auth
    const { data: { users }, error: listError } = await supabaseServer.auth.admin.listUsers();
    const existingAuthUser = users?.find(u => u.email === fullEmail);
    
    if (existingAuthUser) {
      console.log("Found existing Supabase auth user, deleting:", fullEmail);
      // Delete the existing auth user to allow re-registration
      await supabaseServer.auth.admin.deleteUser(existingAuthUser.id);
    }
    
    // Create new Supabase auth user
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: fullEmail,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: { 
        username: username,
        role: "club.admin"
      }
    });

    if (authError) {
      console.error("Supabase auth error:", authError);
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, authError.message));
    }

    if (!authData.user) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to create user")
        );
    }

    // Insert user into auth table with auth_id and role
    const { error: insertError } = await supabaseServer
      .from("auth")
      .insert({
        auth_id: authData.user.id,
        name: name,
        username: username,
        email: null, // Club admin login with username
        role: "club.admin"
      });

    if (insertError) {
      console.error("Auth table insert error:", insertError);

      // Cleanup: Delete Supabase auth user
      try {
        await supabaseServer.auth.admin.deleteUser(authData.user.id);
        console.log("Cleaned up auth user due to table insert failure");
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError);
      }

      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Registration failed. Please try again")
        );
    }

    // Success response
    return res.status(HttpStatusCode.CREATED).json(
      new ApiResponse(HttpStatusCode.CREATED, {
        message: "Registration successful",
        user: {
          id: authData.user.id,
          username: username,
          role: "club.admin"
        }
      })
    );
  } catch (error) {
    console.error("Unexpected registration error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Registration failed. Please try again")
      );
  }
};

/**
 * Get all club admins
 */
export const getAllClubAdmins = async (req, res) => {
  try {
    const { data: clubAdmins, error } = await supabaseServer
      .from("auth")
      .select("id, name, username, auth_id, role, created_at")
      .eq("role", "club.admin");

    if (error) {
      console.error("Database query error:", error);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to fetch club admins")
        );
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(HttpStatusCode.OK, {
        clubAdmins: clubAdmins || []
      })
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to fetch club admins")
      );
  }
};

/**
 * Delete admin by ID
 */
export const deleteAdmin = async (req, res) => {
  try {
    const { id:adminId } = req.params;

    if (!adminId) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Admin ID is required")
        );
    }

  

    // Get the user's auth_id first
    const { data: user, error: getUserError } = await supabaseServer
      .from("auth")
      .select("auth_id, username")
      .eq("auth_id", adminId)
      .single();

    if (getUserError || !user) {
      return res
        .status(HttpStatusCode.NOT_FOUND)
        .json(
          new ApiError(HttpStatusCode.NOT_FOUND, "Admin not found")
        );
    }

    // Delete from auth table
    const { error: deleteDbError } = await supabaseServer
      .from("auth")
      .delete()
      .eq("auth_id", adminId);

    if (deleteDbError) {
      console.error("Database delete error:", deleteDbError);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to delete admin")
        );
    }

    // Delete from Supabase auth
    try {
      await supabaseServer.auth.admin.deleteUser(user.auth_id);
    } catch (authDeleteError) {
      console.error("Auth delete error:", authDeleteError);
      // Continue anyway as the database record is deleted
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(HttpStatusCode.OK, {
        message: "Admin deleted successfully",
        username: user.username
      })
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to delete admin")
      );
  }
};

/**
 * Delete club admin by ID
 */
export const deleteClubAdmin = async (req, res) => {
  try {
    const { id: clubAdminId } = req.params;

    if (!clubAdminId) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Club admin ID is required")
        );
    }

    // Get the user's auth_id first
    const { data: user, error: getUserError } = await supabaseServer
      .from("auth")
      .select("auth_id, username, role")
      .eq("auth_id", clubAdminId)
      .single();

    if (getUserError || !user) {
      return res
        .status(HttpStatusCode.NOT_FOUND)
        .json(
          new ApiError(HttpStatusCode.NOT_FOUND, "Club admin not found")
        );
    }

    // Check if user has club.admin role
    if (user.role !== "club.admin") {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "User is not a club admin")
        );
    }

    // Delete from auth table
    const { error: deleteDbError } = await supabaseServer
      .from("auth")
      .delete()
      .eq("auth_id", clubAdminId);

    if (deleteDbError) {
      console.error("Database delete error:", deleteDbError);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to delete club admin")
        );
    }

    // Delete from Supabase auth
    try {
      await supabaseServer.auth.admin.deleteUser(user.auth_id);
    } catch (authDeleteError) {
      console.error("Auth delete error:", authDeleteError);
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(HttpStatusCode.OK, {
        message: "Club admin deleted successfully",
        username: user.username
      })
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to delete club admin")
      );
  }
};


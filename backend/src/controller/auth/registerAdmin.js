import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { supabaseServer } from "../../db/supabaseServer.js";
import { constructEmail } from "./helpers.js";

/**
 * Register Admin
 * Role is set to 'admin' in backend
 */
export const registerAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Missing required fields: username and password")
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

    // Check if admin already exists by username
    const { data: existingUser, error: userQueryError } = await supabaseServer
      .from("auth")
      .select("id, username, roles, auth_id")
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

    // Check if user exists and already has this role
    if (existingUser) {
      const currentRoles = existingUser.roles || [];
      if (currentRoles.includes("admin")) {
        return res
          .status(HttpStatusCode.CONFLICT)
          .json(
            new ApiError(HttpStatusCode.CONFLICT, `Username already registered as admin`)
          );
      }

      // User exists but doesn't have this role - add the role
      const updatedRoles = [...currentRoles, "admin"];
      const { error: updateError } = await supabaseServer
        .from("auth")
        .update({ roles: updatedRoles })
        .eq("username", username);

      if (updateError) {
        console.error("Role update error:", updateError);
        return res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .json(
            new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to add role to user")
          );
      }

      // Update Supabase auth user metadata
      try {
        await supabaseServer.auth.admin.updateUserById(existingUser.auth_id, {
          user_metadata: {
            username: username,
            roles: updatedRoles
          }
        });
      } catch (metadataError) {
        console.error("Failed to update user metadata:", metadataError);
      }

      return res.status(HttpStatusCode.OK).json(
        new ApiResponse(HttpStatusCode.OK, {
          message: `Role admin added successfully`,
          user: {
            id: existingUser.auth_id,
            username: username,
            roles: updatedRoles
          }
        })
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
        roles: ["admin"]
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

    // Insert user into auth table with auth_id and roles as JSONB array
    // For admin: store username, email is NULL
    const { error: insertError } = await supabaseServer
      .from("auth")
      .insert({
        auth_id: authData.user.id,
        username: username,
        email: null, // Admin login with username
        roles: ["admin"]
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
          roles: ["admin"]
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

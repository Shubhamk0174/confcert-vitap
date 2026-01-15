import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createAnonClient } from "../../db/supabaseClient.js";
import { supabaseServer } from "../../db/supabaseServer.js";
import { extractUsername, constructEmail } from "./helpers.js";

/**
 * Helper function for user registration
 * Internal function that accepts role as parameter
 */
const registerHelper = async (req, res, role) => {
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

    // Check if admin/club.admin already exists by username
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
      if (currentRoles.includes(role)) {
        return res
          .status(HttpStatusCode.CONFLICT)
          .json(
            new ApiError(HttpStatusCode.CONFLICT, `Username already registered as ${role}`)
          );
      }

      // User exists but doesn't have this role - add the role
      const updatedRoles = [...currentRoles, role];
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
          message: `Role ${role} added successfully`,
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
        roles: [role]
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
    // For admin/club.admin: store username, email is NULL
    const { error: insertError } = await supabaseServer
      .from("auth")
      .insert({
        auth_id: authData.user.id,
        username: username,
        email: null, // Admin and club.admin login with username
        roles: [role]
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
          roles: [role]
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
 * Register Admin
 * Role is set to 'admin' in backend
 */
export const registerAdmin = async (req, res) => {
  return registerHelper(req, res, "admin");
};

/**
 * Register Club Admin
 * Role is set to 'club.admin' in backend
 */
export const registerClubAdmin = async (req, res) => {
  return registerHelper(req, res, "club.admin");
};

/**
 * Register Member with Email Confirmation
 * Requires full VIT AP email and sends confirmation email
 */
export const registerMember = async (req, res) => {
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

    // Validate it's a VIT AP email
    if (!username.endsWith("@vitapstudent.ac.in")) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Only VIT AP student emails are allowed for member registration")
        );
    }

    // Check if member already exists by email (members are separate from admins)
    const { data: existingUser, error: userQueryError } = await supabaseServer
      .from("auth")
      .select("id, username, email, roles, auth_id")
      .eq("email", username)
      .single();

    if (userQueryError && userQueryError.code !== "PGRST116") {
      console.error("Database query error:", userQueryError);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Database error occurred")
        );
    }

    // If member already exists with this email, return conflict
    if (existingUser) {
      return res
        .status(HttpStatusCode.CONFLICT)
        .json(
          new ApiError(HttpStatusCode.CONFLICT, "Email already registered. Please use a different email or try logging in.")
        );
    }

    // Check if email already exists in Supabase auth but not in our database
    const { data: { users }, error: listError } = await supabaseServer.auth.admin.listUsers();
    const existingAuthUser = users?.find(u => u.email === username);
    
    if (existingAuthUser) {
      console.log("Found existing Supabase auth user for member, deleting:", username);
      // Delete the existing auth user to allow re-registration
      await supabaseServer.auth.admin.deleteUser(existingAuthUser.id);
    }

    // User doesn't exist - create new member with email verification
    // Members use signUp (requires email confirmation) instead of createUser
    const anonClient = createAnonClient();
    const { data: authData, error: authError } = await anonClient.auth.signUp({
      email: username, // Use full email for members
      password,
      options: {
        data: { 
          roles: ["member"]
        }
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

    // Insert user into auth table with roles as JSONB array
    // For members: store email, username is NULL
    const { error: insertError } = await supabaseServer
      .from("auth")
      .insert({
        auth_id: authData.user.id,
        username: null, // Members login with email, username is idle
        email: username, // Store full email for members
        roles: ["member"]
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
        message: "Registration successful. Please check your email to verify your account before logging in.",
        user: {
          id: authData.user.id,
          username: null, // Members don't have username stored
          email: username,
          roles: ["member"],
          emailVerified: false
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

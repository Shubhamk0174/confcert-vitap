import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createAnonClient } from "../../db/supabaseClient.js";
import { supabaseServer } from "../../db/supabaseServer.js";

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

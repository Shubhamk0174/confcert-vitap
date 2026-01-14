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

    // Extract registration number (accepts direct number or email format)
    const registrationNumber = extractUsername(username);
    if (!registrationNumber) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid username format. Expected: 24bcc7026 or name.24bcc7026@vitapstudent.ac.in")
        );
    }

    // Check if user already exists in auth table
    const { data: existingUser, error: userQueryError } = await supabaseServer
      .from("auth")
      .select("id, username, roles, auth_id")
      .eq("username", registrationNumber)
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
        .eq("username", registrationNumber);

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
            username: registrationNumber,
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
            username: registrationNumber,
            roles: updatedRoles
          }
        })
      );
    }

    // User doesn't exist - create new user
    const fullEmail = constructEmail(registrationNumber);
    
    // Create new Supabase auth user
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: fullEmail,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: { 
        username: registrationNumber,
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
    const { error: insertError } = await supabaseServer
      .from("auth")
      .insert({
        auth_id: authData.user.id,
        username: registrationNumber,
        email: null, // Admin and club.admin don't need email
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
          username: registrationNumber,
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

    // For members, expect full email format
    const registrationNumber = extractUsername(username);
    if (!registrationNumber) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid email format. Expected: name.24bcc7026@vitapstudent.ac.in")
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

    // Check if user already exists in auth table
    const { data: existingUser, error: userQueryError } = await supabaseServer
      .from("auth")
      .select("id, username, roles, auth_id")
      .eq("username", registrationNumber)
      .single();

    if (userQueryError && userQueryError.code !== "PGRST116") {
      console.error("Database query error:", userQueryError);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Database error occurred")
        );
    }

    // Check if user exists and already has member role
    if (existingUser) {
      const currentRoles = existingUser.roles || [];
      if (currentRoles.includes("member")) {
        return res
          .status(HttpStatusCode.CONFLICT)
          .json(
            new ApiError(HttpStatusCode.CONFLICT, "Username already registered as member")
          );
      }

      // User exists but doesn't have this role - add the role
      const updatedRoles = [...currentRoles, "member"];
      const { error: updateError } = await supabaseServer
        .from("auth")
        .update({ 
          roles: updatedRoles,
          email: username // Store full email for members
        })
        .eq("username", registrationNumber);

      if (updateError) {
        console.error("Role update error:", updateError);
        return res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .json(
            new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to add member role to user")
          );
      }

      // Update Supabase auth user metadata
      try {
        await supabaseServer.auth.admin.updateUserById(existingUser.auth_id, {
          user_metadata: {
            username: registrationNumber,
            roles: updatedRoles
          }
        });
      } catch (metadataError) {
        console.error("Failed to update user metadata:", metadataError);
      }

      return res.status(HttpStatusCode.OK).json(
        new ApiResponse(HttpStatusCode.OK, {
          message: "Member role added successfully",
          user: {
            id: existingUser.auth_id,
            username: registrationNumber,
            email: username,
            roles: updatedRoles
          }
        })
      );
    }

    // User doesn't exist - create new member with email verification
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: username, // Use full email for members
      password,
      email_confirm: false, // Require email verification for members
      user_metadata: { 
        username: registrationNumber,
        roles: ["member"]
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
    const { error: insertError } = await supabaseServer
      .from("auth")
      .insert({
        auth_id: authData.user.id,
        username: registrationNumber,
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
          username: registrationNumber,
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

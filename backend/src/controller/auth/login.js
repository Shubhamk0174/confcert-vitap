import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createAnonClient } from "../../db/supabaseClient.js";
import { supabaseServer } from "../../db/supabaseServer.js";
import { extractUsername, constructEmail } from "./helpers.js";

/**
 * Helper function for user login
 * Internal function that accepts role as parameter for role-based login
 */
const loginHelper = async (req, res, expectedRole) => {
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

    // Check if user exists in auth table
    const { data: userData, error: userQueryError } = await supabaseServer
      .from("auth")
      .select("id, username, roles")
      .eq("username", username)
      .single();

    if (userQueryError || !userData) {
      console.error("User not found in auth table:", username, userQueryError);
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials")
        );
    }

    console.log("User found in DB:", userData);

    // Verify the user has the correct role for this login endpoint
    const userRoles = userData.roles || [];
    if (!userRoles.includes(expectedRole)) {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, `Access denied. This account does not have ${expectedRole} role. Available roles: ${userRoles.join(", ")}. Please use the correct login endpoint.`)
        );
    }

    // Sign in with Supabase auth
    const anonClient = createAnonClient();
    const fullEmail = constructEmail(username);
    console.log("Attempting Supabase auth with email:", fullEmail);

    const { data, error } = await anonClient.auth.signInWithPassword({
      email: fullEmail,
      password
    });

    if (error) {
      console.error("Supabase auth login error:", error.message, "| Status:", error.status, "| Email used:", fullEmail);
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials"));
    }

    if (!data.user || !data.session) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "Authentication failed")
        );
    }

    // Return successful login response
    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(HttpStatusCode.OK, {
        message: "Login successful",
        user: {
          id: data.user.id,
          username: username,
          roles: userData.roles,
          currentRole: expectedRole
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in
        }
      })
    );
  } catch (error) {
    console.error("Unexpected login error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Login failed. Please try again")
      );
  }
};

/**
 * Admin Login
 * Only allows login for users with admin role
 */
export const loginAdmin = async (req, res) => {
  return loginHelper(req, res, "admin");
};

/**
 * Club Admin Login
 * Only allows login for users with club.admin role
 */
export const loginClubAdmin = async (req, res) => {
  return loginHelper(req, res, "club.admin");
};

/**
 * Member Login with Full Email
 * Requires full email and email verification
 */
export const loginMember = async (req, res) => {
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

    // For members, expect full email
    if (!username.endsWith("@vitapstudent.ac.in")) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Please use your full VIT AP email address")
        );
    }

    // Extract registration number from email
    const registrationNumber = extractUsername(username);
    if (!registrationNumber) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid email format")
        );
    }

    // Check if user exists in auth table with member role
    // Members are stored with email (username is NULL)
    const { data: userData, error: userQueryError } = await supabaseServer
      .from("auth")
      .select("id, username, email, roles")
      .eq("email", username) // Query by full email for members
      .single();

    if (userQueryError || !userData) {
      console.error("User not found in auth table:", username, userQueryError);
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials")
        );
    }

    // Verify the user has member role
    const userRoles = userData.roles || [];
    if (!userRoles.includes("member")) {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, `Access denied. This account does not have member role. Please use the correct login endpoint.`)
        );
    }

    console.log("User found in DB:", userData);

    // Sign in with Supabase auth using full email
    const anonClient = createAnonClient();

    const { data, error } = await anonClient.auth.signInWithPassword({
      email: username, // Use full email for members
      password
    });

    if (error) {
      console.error("Supabase auth login error:", error.message, "| Status:", error.status);
      
      // Check if email is not confirmed
      if (error.message.includes("Email not confirmed")) {
        return res
          .status(HttpStatusCode.FORBIDDEN)
          .json(
            new ApiError(HttpStatusCode.FORBIDDEN, "Email not verified. Please check your inbox and verify your email before logging in.")
          );
      }
      
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials"));
    }

    if (!data.user || !data.session) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "Authentication failed")
        );
    }

    // Check if email is confirmed
    if (!data.user.email_confirmed_at) {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, "Email not verified. Please check your inbox and verify your email before logging in.")
        );
    }

    // Return successful login response
    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(HttpStatusCode.OK, {
        message: "Login successful",
        user: {
          id: data.user.id,
          username: null, // Members don't have username stored
          email: username, // Return full email
          roles: userData.roles,
          currentRole: "member",
          emailVerified: true
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in
        }
      })
    );
  } catch (error) {
    console.error("Unexpected login error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Login failed. Please try again")
      );
  }
};

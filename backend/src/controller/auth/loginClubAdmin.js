import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createAnonClient } from "../../db/supabaseClient.js";
import { supabaseServer } from "../../db/supabaseServer.js";
import { constructEmail } from "../../utils/helpers.js";

/**
 * Club Admin Login
 * Only allows login for users with club.admin role
 */
export const loginClubAdmin = async (req, res) => {
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
    let userData, userQueryError;
    try {
      const result = await supabaseServer
        .from("auth")
        .select("id, username, role, name")
        .eq("username", username)
        .single();
      userData = result.data;
      userQueryError = result.error;
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return res
        .status(HttpStatusCode.SERVICE_UNAVAILABLE)
        .json(
          new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Database service temporarily unavailable. Please check your internet connection and try again.")
        );
    }

    // Check if it's a network/connection error
    if (userQueryError) {
      const errorMessage = userQueryError.message || '';
      const errorDetails = userQueryError.details || '';
      
      // Network errors: ENOTFOUND, fetch failed, connection refused, etc.
      if (errorMessage.includes('fetch failed') || 
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorDetails.includes('ENOTFOUND') ||
          errorDetails.includes('fetch failed') ||
          errorDetails.includes('ECONNREFUSED')) {
        console.error("Database connection error:", userQueryError);
        return res
          .status(HttpStatusCode.SERVICE_UNAVAILABLE)
          .json(
            new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Database service temporarily unavailable. Please check your internet connection and try again.")
          );
      }
    }

    if (userQueryError || !userData) {
      console.error("User not found in auth table:", username, userQueryError);
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid username or password")
        );
    }

    console.log("User found in DB:", userData);

    // Verify the user has the correct role for this login endpoint
    const userRole = userData.role;
    if (userRole !== "club.admin") {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, `Access denied. This account does not have club admin role.`)
        );
    }

    // Sign in with Supabase auth
    const anonClient = createAnonClient();
    const fullEmail = constructEmail(username);
    console.log("Attempting Supabase auth with email:", fullEmail);

    let data, error;
    try {
      const result = await anonClient.auth.signInWithPassword({
        email: fullEmail,
        password
      });
      data = result.data;
      error = result.error;
    } catch (authError) {
      console.error("Authentication service connection error:", authError);
      return res
        .status(HttpStatusCode.SERVICE_UNAVAILABLE)
        .json(
          new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Authentication service temporarily unavailable. Please check your internet connection and try again.")
        );
    }

    // Check if auth error is network-related
    if (error) {
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('fetch failed') || 
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ECONNREFUSED')) {
        console.error("Authentication service connection error:", error);
        return res
          .status(HttpStatusCode.SERVICE_UNAVAILABLE)
          .json(
            new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Authentication service temporarily unavailable. Please check your internet connection and try again.")
          );
      }
    }

    if (error) {
      console.error("Supabase auth login error:", error.message, "| Status:", error.status, "| Email used:", fullEmail);
      
      // Provide more specific error messages
      let errorMessage = "Invalid username or password";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid username or password";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Email not verified. Please verify your email first.";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (error.status >= 500) {
        errorMessage = "Authentication service temporarily unavailable. Please try again later.";
      }
      
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(new ApiError(HttpStatusCode.UNAUTHORIZED, errorMessage));
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
          name: userData.name,
          role: userData.role,
          currentRole: "club.admin"
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

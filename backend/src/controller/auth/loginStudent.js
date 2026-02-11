import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createAnonClient } from "../../db/supabaseClient.js";
import { supabaseServer } from "../../db/supabaseServer.js";

/**
 * Student Login with Full Email
 * Requires full email and email verification
 */
export const loginStudent = async (req, res) => {
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

    // For students, expect full email
    if (!username.endsWith("@vitapstudent.ac.in")) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Please use your full VIT AP email address")
        );
    }

    // Check if user exists in auth table with student role
    // Students are stored with email 
    let userData, userQueryError;
    try {
      const result = await supabaseServer
        .from("auth")
        .select("id, username, email, role, name")
        .eq("email", username) // Query by full email for students
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
          new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid email or password")
        );
    }

    // Verify the user has student role
    const userRole = userData.role;
    if (userRole !== "student") {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, `Access denied. This account does not have student role. Please use the correct login endpoint.`)
        );
    }

    console.log("User found in DB:", userData);

    // Sign in with Supabase auth using full email
    const anonClient = createAnonClient();

    let data, error;
    try {
      const result = await anonClient.auth.signInWithPassword({
        email: username, // Use full email for students
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
      console.error("Supabase auth login error:", error.message, "| Status:", error.status);
      
      // Provide more specific error messages
      if (error.message.includes("Email not confirmed")) {
        return res
          .status(HttpStatusCode.FORBIDDEN)
          .json(
            new ApiError(HttpStatusCode.FORBIDDEN, "Email not verified. Please check your inbox and verify your email before logging in.")
          );
      }
      
      let errorMessage = "Invalid email or password";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password";
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
          username: userData.username,
          name: userData.name,
          email: username, // Return full email
          role: userData.role,
          currentRole: "student",
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

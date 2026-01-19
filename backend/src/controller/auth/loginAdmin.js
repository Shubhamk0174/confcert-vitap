import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createAnonClient } from "../../db/supabaseClient.js";
import { supabaseServer } from "../../db/supabaseServer.js";
import { constructEmail } from "../../utils/helpers.js";

/**
 * Admin Login
 * Only allows login for users with admin role
 */
export const loginAdmin = async (req, res) => {
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
      .select("id, username, role")
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
    const userRole = userData.role;
    if (userRole !== "admin") {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, `Access denied. This account does not have admin role.`)
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
          role: userData.role,
          currentRole: "admin"
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

import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { supabaseServer } from "../../db/supabaseServer.js";

/**
 * Get authenticated user data
 * Requires authentication middleware
 */
export const getUserData = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated")
        );
    }
    
    
    let userData, userQueryError;
    try {
      const result = await supabaseServer
        .from("auth")
        .select("username, name, email, role, created_at")
        .eq("auth_id", userId)
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
      console.error("User data query error:", userQueryError);
      const errorMessage = userQueryError 
        ? "Failed to retrieve user data. Please try again." 
        : "User profile not found.";
      return res
        .status(HttpStatusCode.NOT_FOUND)
        .json(
          new ApiError(HttpStatusCode.NOT_FOUND, errorMessage)
        );
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(HttpStatusCode.OK, {
        user: {
          id: userId,
          username: userData.username,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          created_at: userData.created_at
        }
      })
    );
  } catch (error) {
    console.error("Unexpected error in getUserData:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "An unexpected error occurred")
      );
  }
};

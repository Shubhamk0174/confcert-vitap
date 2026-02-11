import { ApiError } from "../utils/ApiError.js";
import { HttpStatusCode } from "../utils/httpStatusCode.js";
import { supabaseServer } from "../db/supabaseServer.js";

/**
 * Middleware to verify if user is authenticated
 * Extracts and validates JWT token from Authorization header
 * Attaches user info to req.user
 */
export const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "No authorization token provided")
        );
    }

    const token = authHeader.split(" ")[1];

    // Verify token with Supabase
    let user, error;
    try {
      const result = await supabaseServer.auth.getUser(token);
      user = result.data?.user;
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

    if (error || !user) {
      console.log("Authentication failed:", error?.message || "User not found");
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid or expired token")
        );
    }

    console.log("user id", user.id);

    // Get user data from auth table
    let userData;
    let dbError;

    // Try to find by auth_id first (most reliable)
    try {
      const result = await supabaseServer
        .from("auth")
        .select("id, name ,username, email, role, auth_id")
        .eq("auth_id", user.id)
        .single();
      
      userData = result.data;
      dbError = result.error;
    } catch (queryError) {
      console.error("Database connection error:", queryError);
      return res
        .status(HttpStatusCode.SERVICE_UNAVAILABLE)
        .json(
          new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Database service temporarily unavailable. Please check your internet connection and try again.")
        );
    }

    // Check if it's a network/connection error
    if (dbError) {
      const errorMessage = dbError.message || '';
      const errorDetails = dbError.details || '';
      
      if (errorMessage.includes('fetch failed') || 
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorDetails.includes('ENOTFOUND') ||
          errorDetails.includes('fetch failed') ||
          errorDetails.includes('ECONNREFUSED')) {
        console.error("Database connection error:", dbError);
        return res
          .status(HttpStatusCode.SERVICE_UNAVAILABLE)
          .json(
            new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Database service temporarily unavailable. Please check your internet connection and try again.")
          );
      }
    }
    
    if (dbError || !userData) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "User not found in database")
        );
    }

    // Attach user info to request object
    req.user = {
      id: userData.auth_id , // Use auth_id if available, otherwise use Supabase user id
      username: userData.username || null, // For admin/club.admin
      name: userData.name,
      email: userData.email || null, // For students
      role: userData.role || null, // Single role text
      dbId: userData.id // The auto-increment id from auth table
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Authentication failed")
      );
  }
};

/**
 * Middleware to check if user has admin role
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated")
        );
    }

    const userRole = req.user.role;
    if (userRole !== "admin") {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, "Access denied. Admin role required")
        );
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Authorization check failed")
      );
  }
};

/**
 * Middleware to check if user has club.admin role
 */
export const isClubAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated")
        );
    }

    const userRole = req.user.role;
    if (userRole !== "club.admin") {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, "Access denied. Club admin role required")
        );
    }

    next();
  } catch (error) {
    console.error("Club admin middleware error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Authorization check failed")
      );
  }
};

/**
 * Middleware to check if user has student role
 */
export const isStudent = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated")
        );
    }

    const userRole = req.user.role;
    if (userRole !== "student") {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, "Access denied. Student role required")
        );
    }

    next();
  } catch (error) {
    console.error("Student middleware error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Authorization check failed")
      );
  }
};

/**
 * Middleware to check if user has admin OR club.admin role
 */
export const isAdminOrClubAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated")
        );
    }

    const userRole = req.user.role;
    if (userRole !== "admin" && userRole !== "club.admin") {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, "Access denied. Admin or Club admin role required")
        );
    }

    next();
  } catch (error) {
    console.error("Admin or Club admin middleware error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Authorization check failed")
      );
  }
};

/**
 * Middleware factory to check if user has any of the specified roles
 * Usage: hasAnyRole(['admin', 'club.admin'])
 */
export const hasAnyRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res
          .status(HttpStatusCode.UNAUTHORIZED)
          .json(
            new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated")
          );
      }

      const userRole = req.user.role;
      const hasRole = allowedRoles.includes(userRole);
      
      if (!hasRole) {
        return res
          .status(HttpStatusCode.FORBIDDEN)
          .json(
            new ApiError(HttpStatusCode.FORBIDDEN, `Access denied. Required roles: ${allowedRoles.join(", ")}`)
          );
      }

      next();
    } catch (error) {
      console.error("Role check middleware error:", error);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Authorization check failed")
        );
    }
  };
};

import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { supabaseServer } from "../../db/supabaseServer.js";

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
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);

    if (error || !user) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid or expired token")
        );
    }

    // Get user data from auth table
    // Members have email (username is NULL), Admins have username (email is NULL)
    let userData;
    let dbError;

    // Try to find by auth_id first (most reliable)
    const result = await supabaseServer
      .from("auth")
      .select("id, username, email, roles, auth_id")
      .eq("auth_id", user.id)
      .single();
    
    userData = result.data;
    dbError = result.error;

    if (dbError || !userData) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "User not found in database")
        );
    }

    // Attach user info to request object
    // Members have email (username is NULL), Admins have username (email is NULL)
    req.user = {
      id: userData.auth_id || user.id, // Use auth_id if available, otherwise use Supabase user id
      username: userData.username || null, // For admin/club.admin
      email: userData.email || null, // For members
      roles: userData.roles || [], // Array of roles
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

    const userRoles = req.user.roles || [];
    if (!userRoles.includes("admin")) {
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

    const userRoles = req.user.roles || [];
    if (!userRoles.includes("club.admin")) {
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
 * Middleware to check if user has member role
 */
export const isMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json(
          new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated")
        );
    }

    const userRoles = req.user.roles || [];
    if (!userRoles.includes("member")) {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json(
          new ApiError(HttpStatusCode.FORBIDDEN, "Access denied. Member role required")
        );
    }

    next();
  } catch (error) {
    console.error("Member middleware error:", error);
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

    const userRoles = req.user.roles || [];
    if (!userRoles.includes("admin") && !userRoles.includes("club.admin")) {
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

      const userRoles = req.user.roles || [];
      const hasRole = allowedRoles.some(role => userRoles.includes(role));
      
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

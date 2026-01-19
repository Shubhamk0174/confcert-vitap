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

    // Get user data from Supabase auth
    // const { data: authUser, error: authError } = await supabaseServer.auth.admin.getUserById(userId);

    // if (authError || !authUser.user) {
    //   return res
    //     .status(HttpStatusCode.NOT_FOUND)
    //     .json(
    //       new ApiError(HttpStatusCode.NOT_FOUND, "User not found")
    //     );
    // }

    // const username = userId

    // Get role from auth table
    const { data: userData, error: userQueryError } = await supabaseServer
      .from("auth")
      .select("username, name, email, role, created_at")
      .eq("auth_id", userId)
      .single();

    if (userQueryError || !userData) {
      return res
        .status(HttpStatusCode.NOT_FOUND)
        .json(
          new ApiError(HttpStatusCode.NOT_FOUND, "User data not found")
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

import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createAnonClient } from "../../db/supabaseClient.js";
import { supabaseServer } from "../../db/supabaseServer.js";

/**
 * Register Student with Email Confirmation
 * Requires full VIT AP email and sends confirmation email
 */
export const registerStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Missing required fields: email and password")
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
    if (!email.endsWith("@vitapstudent.ac.in")) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Only VIT AP student emails are allowed for student registration")
        );
    }

    // Check if student already exists by email (students are separate from admins)
    let existingUser, userQueryError;
    try {
      const result = await supabaseServer
        .from("auth")
        .select("id, username, email, role, auth_id")
        .eq("email", email)
        .single();
      existingUser = result.data;
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
    if (userQueryError && userQueryError.code !== "PGRST116") {
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

    if (userQueryError && userQueryError.code !== "PGRST116") {
      console.error("Database query error:", userQueryError);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Database error occurred")
        );
    }

    // If student already exists with this email, return conflict
    if (existingUser) {
      return res
        .status(HttpStatusCode.CONFLICT)
        .json(
          new ApiError(HttpStatusCode.CONFLICT, "Email already registered. Please use a different email or try logging in.")
        );
    }

    // Check if email already exists in Supabase auth but not in our database
    let users, listError;
    try {
      const result = await supabaseServer.auth.admin.listUsers();
      users = result.data?.users;
      listError = result.error;
    } catch (authError) {
      console.error("Authentication service connection error:", authError);
      return res
        .status(HttpStatusCode.SERVICE_UNAVAILABLE)
        .json(
          new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Authentication service temporarily unavailable. Please check your internet connection and try again.")
        );
    }
    
    // Check if listError is network-related
    if (listError) {
      const errorMessage = listError.message || '';
      
      if (errorMessage.includes('fetch failed') || 
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ECONNREFUSED')) {
        console.error("Authentication service connection error:", listError);
        return res
          .status(HttpStatusCode.SERVICE_UNAVAILABLE)
          .json(
            new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Authentication service temporarily unavailable. Please check your internet connection and try again.")
          );
      }
    }
    
    const existingAuthUser = users?.find(u => u.email === email);
    
    if (existingAuthUser) {
      console.log("Found existing Supabase auth user for student, deleting:", email);
      try {
        // Delete the existing auth user to allow re-registration
        await supabaseServer.auth.admin.deleteUser(existingAuthUser.id);
      } catch (deleteError) {
        console.error("Error deleting existing auth user:", deleteError);
        // Continue with registration attempt
      }
    }

    // User doesn't exist - create new student with email verification
    // Members use signUp (requires email confirmation) instead of createUser
    const anonClient = createAnonClient();
    let authData, authError;
    try {
      const result = await anonClient.auth.signUp({
        email: email, // Use full email for students
        password,
        options: {
          data: { 
            role: "student"
          }
        }
      });
      authData = result.data;
      authError = result.error;
    } catch (signUpError) {
      console.error("Authentication service connection error:", signUpError);
      return res
        .status(HttpStatusCode.SERVICE_UNAVAILABLE)
        .json(
          new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Authentication service temporarily unavailable. Please check your internet connection and try again.")
        );
    }

    // Check if authError is network-related
    if (authError) {
      const errorMessage = authError.message || '';
      
      if (errorMessage.includes('fetch failed') || 
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ECONNREFUSED')) {
        console.error("Authentication service connection error:", authError);
        return res
          .status(HttpStatusCode.SERVICE_UNAVAILABLE)
          .json(
            new ApiError(HttpStatusCode.SERVICE_UNAVAILABLE, "Authentication service temporarily unavailable. Please check your internet connection and try again.")
          );
      }
    }

    if (authError) {
      console.error("Supabase auth error:", authError);
      
      // Provide more specific error messages
      let errorMessage = authError.message;
      
      if (authError.message.includes("already registered")) {
        errorMessage = "This email is already registered. Please try logging in instead.";
      } else if (authError.message.includes("Password should be")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (authError.status >= 500) {
        errorMessage = "Authentication service temporarily unavailable. Please try again later.";
      }
      
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, errorMessage));
    }

    if (!authData.user) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to create user")
        );
    }

    // Generate clean username for student (format: student_123456)
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    const username = `student_${randomNum}`;

    // Ensure uniqueness by checking if username already exists
    let finalUsername = username;
    let counter = 1;
    while (true) {
      const { data: existingUsername } = await supabaseServer
        .from("auth")
        .select("id")
        .eq("username", finalUsername)
        .single();

      if (!existingUsername) break; // Username is available

      // If exists, append counter
      finalUsername = `${username}_${counter}`;
      counter++;

      // Prevent infinite loop
      if (counter > 100) {
        finalUsername = `student_${Date.now()}`;
        break;
      }
    }

    // Insert user into auth table with role
    const { error: insertError } = await supabaseServer
      .from("auth")
      .insert({
        auth_id: authData.user.id,
        name: email.split(".")[0], 
        username: username, // Randomly generated username for students
        email: email, // Store full email for students
        role: "student"
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
          username: username,
          email: email,
          role: "student",
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

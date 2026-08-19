// hmne jo bakend me 4 api bnaye hai usse hmara frontend kaise connect hoga aur kaise contatact krega ye hmne yha pe bnaye hai
// fronted ko backend se connect krne k liye we need package called axios
// aur ye fronetend ka data backend ko bhej rha hau
// Register Page
//       ↓
// User username, email, password fill karega
//       ↓
// Register button click hoga
//       ↓
// registerUser(username, email, password) call hoga
//       ↓
// Axios POST request bhejega
//       ↓
// http://localhost:3000/api/auth/register
//       ↓
// Backend request receive karega
//       ↓
// req.body me milega:
// {
//   username,
//   email,
//   password
// }
//       ↓
// Backend database me user save karega
//       ↓
// Response frontend ko bhej dega

import axios from "axios";

const authApi = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export async function registeruser(username, email, password) {
  try {
    const response = await authApi.post("/api/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (err) {
    console.error("Error registering user:", err);
    throw err;
  }
}

export async function loginuser(email, password) {
  try {
    const response = await authApi.post("/api/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (err) {
    console.error("Error logging in user:", err);
    throw err;
  }
}

export async function logoutuser() {
  try {
    const response = await authApi.get("/api/auth/logout");
    return response.data;
  } catch (err) {
    console.error("Error logging out user:", err);
    throw err;
  }
}

export async function getme() {
  try {
    const response = await authApi.get("/api/auth/get-me");
    return response.data;
  } catch (err) {
    console.log("User not logged in / session invalid");
    throw err;
  }
}

// User
//    ↓
// Login Page (React)
//    ↓
// Axios POST Request
//    ↓
// Backend Route (/api/auth/login)
//    ↓
// Controller
//    ↓
// Database (MongoDB)
//    ↓
// Controller Response (Token)
//    ↓
// Frontend
//    ↓
// localStorage + Navigate("/dashboard")
import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(new URL("/signin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));

  // 🧹 Supprime le cookie d'authentification
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    path: "/",
    expires: new Date(0), // expire immédiatement
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function POST() {
  // Même logique si jamais on fait un logout via POST (optionnel)
  const response = NextResponse.redirect(new URL("/signin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

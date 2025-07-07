import { getServerSession as originalGetServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getServerSession() {
  return originalGetServerSession(authOptions);
}

export { authOptions } from "@/app/api/auth/[...nextauth]/route";

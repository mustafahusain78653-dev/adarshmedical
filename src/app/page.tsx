import { redirect } from "next/navigation";

export default function Home() {
  // Middleware already protects `/` and redirects to `/login` when not authenticated.
  // If authenticated, take the user straight to the app.
  redirect("/dashboard");
}

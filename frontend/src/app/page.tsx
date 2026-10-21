import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants";

export default function Home() {
  redirect(APP_ROUTES.PRODUCTS);
}

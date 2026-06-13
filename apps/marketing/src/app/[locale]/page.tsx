import { Suspense } from "react";
import HomePage from "@/components/HomePage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}

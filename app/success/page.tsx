"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userHasPaid", "true");
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 to-blue-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
      <p className="mb-8 text-lg">Thank you for upgrading. You now have unlimited team name generations.</p>
      <button
        className="px-6 py-3 rounded-full bg-blue-500 text-white font-semibold text-lg hover:bg-blue-600 transition"
        onClick={() => router.push("/")}
      >
        Return to Generator
      </button>
    </div>
  );
} 
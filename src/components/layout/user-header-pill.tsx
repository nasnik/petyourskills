"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useApp } from "@/lib/store/app-context";
import { createClient } from "@/lib/supabase/client";

/** Derives up to 2 initials from a display name */
function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserHeaderPill() {
  const { user } = useApp();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const initials = getInitials(user.callSign);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    try {
      const { clearPysUidCookie } = await import("@/actions/auth");
      await clearPysUidCookie();
    } catch {
      // ignore
    }
    router.push("/sign-in");
  };

  return (
    <div className="flex items-center gap-2">
      {/* User info pill */}
      <div className="flex items-center gap-3 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-white/10">
        <div className="w-7 h-7 rounded-full bg-wellness-emerald/20 border border-wellness-emerald/40 flex items-center justify-center text-xs font-bold text-wellness-emerald">
          {initials}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white leading-tight">
              {user.callSign}
            </span>
            {user.isAnonymous ? (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-semibold">
                GUEST
              </span>
            ) : (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-wellness-emerald/20 text-wellness-emerald font-semibold">
                PRO
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-outline leading-tight">
            {user.isAnonymous ? "Anonymous session" : user.email}
          </span>
        </div>
      </div>

      {/* Sign-out button */}
      <button
        id="sign-out-button"
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        title="Sign out"
        className="h-9 w-9 rounded-full border border-white/10 bg-surface-container-lowest flex items-center justify-center text-outline hover:text-white hover:border-white/30 hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <LogOut size={15} className={signingOut ? "animate-pulse" : ""} />
      </button>
    </div>
  );
}

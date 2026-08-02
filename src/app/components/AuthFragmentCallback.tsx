"use client";

import { useEffect } from "react";
import { safeReturnPath } from "@/lib/auth/returnPath";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const editorReturnPath = "/admin/review";

function cleanCallbackUrl() {
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

export function AuthFragmentCallback() {
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");

    if (!accessToken || !refreshToken) return;

    const returnTo = safeReturnPath(
      new URLSearchParams(window.location.search).get("returnTo") ?? editorReturnPath,
    );
    cleanCallbackUrl();

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      window.location.replace(
        `/auth/sign-in?status=unavailable&returnTo=${encodeURIComponent(returnTo)}`,
      );
      return;
    }

    void supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          window.location.replace(
            `/auth/sign-in?status=invalid-link&returnTo=${encodeURIComponent(returnTo)}`,
          );
          return;
        }
        window.location.replace(returnTo);
      });
  }, []);

  return null;
}

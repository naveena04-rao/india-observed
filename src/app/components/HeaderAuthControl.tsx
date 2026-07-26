import Link from "next/link";
import { safeReturnPath } from "@/lib/auth/returnPath";

type HeaderAuthControlProps = {
  returnTo: string;
  signedIn: boolean;
};

export function HeaderAuthControl({ returnTo, signedIn }: HeaderAuthControlProps) {
  const encodedReturnTo = encodeURIComponent(safeReturnPath(returnTo));

  return signedIn ? (
    <form
      className="header-auth-form"
      action={`/auth/sign-out?returnTo=${encodedReturnTo}`}
      method="post"
    >
      <button className="header-login-control" type="submit">
        Logout
      </button>
    </form>
  ) : (
    <Link className="header-login-control" href={`/auth/sign-in?returnTo=${encodedReturnTo}`}>
      Login
    </Link>
  );
}

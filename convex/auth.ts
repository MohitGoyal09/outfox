import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTPPasswordReset } from "./passwordReset";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: ResendOTPPasswordReset,
      profile(params) {
        return {
          email: params.email as string,
          ...(typeof params.name === "string" && params.name.trim() !== ""
            ? { name: params.name.trim() }
            : {}),
        };
      },
    }),
  ],
});

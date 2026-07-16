import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export const dynamic = "force-dynamic";

export default function SignIn() {
  const showGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const showAzure = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-canvas text-foreground">Loading...</div>}>
      <SignInForm showGoogle={showGoogle} showAzure={showAzure} />
    </Suspense>
  );
}

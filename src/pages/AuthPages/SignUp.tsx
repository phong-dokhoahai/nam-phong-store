import SignUpForm from "@/components/auth/SignUpForm";
import AuthLayout from "./AuthPageLayout";

export default function SignUp() {
  return (
    <>
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}

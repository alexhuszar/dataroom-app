"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { signIn as nextAuthSignIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/contexts/AuthContext";

type FormType = "sign-in" | "sign-up";

const baseSchema = {
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Must include uppercase, lowercase, and number"
    ),
};

const signInSchema = z.object(baseSchema);

const signUpSchema = z
  .object({
    ...baseSchema,
    fullName: z.string().min(2).max(50),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;
type FormValues = SignInValues | SignUpValues;

const PasswordField = ({
  control,
  name,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: "password" | "confirmPassword";
  label: string;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="shad-form-label">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type={visible ? "text" : "password"}
                className="shad-input pr-10"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const { signUp, signIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const schema = type === "sign-up" ? signUpSchema : signInSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      ...(type === "sign-up" && {
        fullName: "",
        confirmPassword: "",
      }),
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setLoading(true);
    setError("");

    try {
      if (type === "sign-up") {
        const data = values as SignUpValues;
        const result = await signUp(data.fullName, data.email, data.password);

        if (result?.error) setError(result.error);
        else router.push("/");
      } else {
        const data = values as SignInValues;
        const result = await signIn(data.email, data.password);

        if (result?.error) setError(result.error);
        else router.push("/");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    await nextAuthSignIn("google", { callbackUrl: "/" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
        <h1 className="form-title">
          {type === "sign-in" ? "Sign In" : "Sign Up"}
        </h1>

        {type === "sign-up" && (
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} className="shad-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" className="shad-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <PasswordField
          control={form.control}
          name="password"
          label="Password"
        />

        {type === "sign-up" && (
          <PasswordField
            control={form.control}
            name="confirmPassword"
            label="Confirm Password"
          />
        )}

        <Button type="submit" disabled={loading} className="form-submit-button">
          {type === "sign-in" ? "Sign In" : "Sign Up"}
          {loading && <LoaderCircle />}
        </Button>

        {error && <p className="error-message">*{error}</p>}

        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full"
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          <Image
            src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
            alt="Google"
            width={18}
            height={18}
          />
          <span className="ml-2">Continue with Google</span>
        </Button>

        <p className="mt-4 text-center">
          {type === "sign-in"
            ? "Don't have an account?"
            : "Already have an account?"}
          <Link
            href={type === "sign-in" ? "/sign-up" : "/sign-in"}
            className="ml-1  font-medium text-brand"
          >
            {type === "sign-in" ? "Sign Up" : "Sign In"}
          </Link>
        </p>
      </form>
    </Form>
  );
};

export default AuthForm;

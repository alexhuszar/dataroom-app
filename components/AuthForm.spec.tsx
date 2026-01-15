import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { AuthForm } from "./AuthForm";
import { useAuth } from "@/lib/contexts/AuthContext";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { useRouter } from "next/navigation";

jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next/image", () => (props: any) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img {...props} />
));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

const pushMock = jest.fn();
const signInMock = jest.fn();
const signUpMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  (useRouter as jest.Mock).mockReturnValue({
    push: pushMock,
  });

  (useAuth as jest.Mock).mockReturnValue({
    signIn: signInMock,
    signUp: signUpMock,
  });
});

const getPasswordInput = (label: RegExp = /^password$/i) => {
  const labelElement = screen.getByText(label);
  const formItem = labelElement.closest(".space-y-2");
  return formItem?.querySelector('input[name="password"]') as HTMLInputElement;
};

const getConfirmPasswordInput = () => {
  const labelElement = screen.getByText(/confirm password/i);
  const formItem = labelElement.closest(".space-y-2");
  return formItem?.querySelector(
    'input[name="confirmPassword"]'
  ) as HTMLInputElement;
};

describe("AuthForm – Sign In", () => {
  it("renders sign-in form correctly", () => {
    render(<AuthForm type="sign-in" />);

    expect(
      screen.getByRole("heading", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it("validates email and password fields", async () => {
    const user = userEvent.setup();
    render(<AuthForm type="sign-in" />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/at least 8 characters/i)
    ).toBeInTheDocument();
  });

  it("submits sign-in successfully and redirects", async () => {
    const user = userEvent.setup();

    signInMock.mockResolvedValue({ accountId: "test@mail.com" });

    render(<AuthForm type="sign-in" />);

    await user.type(screen.getByLabelText(/email/i), "test@mail.com");
    await user.type(getPasswordInput(), "Password1");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("test@mail.com", "Password1");
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  it("shows error when sign-in fails", async () => {
    const user = userEvent.setup();

    signInMock.mockResolvedValue({ error: "Invalid credentials" });

    render(<AuthForm type="sign-in" />);

    await user.type(screen.getByLabelText(/email/i), "test@mail.com");
    await user.type(getPasswordInput(), "Password1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});

describe("AuthForm – Sign Up", () => {
  it("renders sign-up fields", () => {
    render(<AuthForm type="sign-up" />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(getConfirmPasswordInput()).toBeInTheDocument();
  });

  it("validates password mismatch", async () => {
    const user = userEvent.setup();
    render(<AuthForm type="sign-up" />);

    await user.type(screen.getByLabelText(/full name/i), "John");
    await user.type(screen.getByLabelText(/email/i), "test@mail.com");
    await user.type(getPasswordInput(), "Password1");
    await user.type(getConfirmPasswordInput(), "Password2");

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/passwords do not match/i)
    ).toBeInTheDocument();
  });

  it("submits sign-up successfully and redirects", async () => {
    const user = userEvent.setup();

    signUpMock.mockResolvedValue({ accountId: "test@mail.com" });

    render(<AuthForm type="sign-up" />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "test@mail.com");
    await user.type(getPasswordInput(), "Password1");
    await user.type(getConfirmPasswordInput(), "Password1");

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(
        "John Doe",
        "test@mail.com",
        "Password1"
      );
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });
});

describe("AuthForm – UI Behavior", () => {
  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<AuthForm type="sign-in" />);

    const passwordInput = getPasswordInput();
    const toggleButton = passwordInput.parentElement!.querySelector("button")!;

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("triggers Google auth flow", async () => {
    const user = userEvent.setup();

    render(<AuthForm type="sign-in" />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i })
    );

    expect(nextAuthSignIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/",
    });
  });

  it("disables buttons while loading", async () => {
    const user = userEvent.setup();

    signInMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<AuthForm type="sign-in" />);

    await user.type(screen.getByLabelText(/email/i), "test@mail.com");
    await user.type(getPasswordInput(), "Password1");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: { signInWithPassword, signUp } }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

import { AuthForm } from "@/features/auth/auth-form";

beforeEach(() => {
  signInWithPassword.mockReset();
  signUp.mockReset();
  replace.mockReset();
  refresh.mockReset();
});

describe("AuthForm", () => {
  it("signs in and moves on to the requested page", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AuthForm mode="login" next="/workspaces/abc" />);
    await user.type(screen.getByLabelText("Email"), "ada@example.org");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/workspaces/abc"));
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ada@example.org",
      password: "correct-horse",
    });
  });

  it("ignores redirect targets that leave the site", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AuthForm mode="login" next="//evil.example" />);
    await user.type(screen.getByLabelText("Email"), "ada@example.org");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/workspaces"));
  });

  it("shows the server message and stays on the page when sign in fails", async () => {
    signInWithPassword.mockResolvedValue({ error: new Error("Invalid login credentials") });
    const user = userEvent.setup();
    render(<AuthForm mode="login" next={undefined} />);
    await user.type(screen.getByLabelText("Email"), "ada@example.org");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid login credentials");
    expect(replace).not.toHaveBeenCalled();
  });

  it("asks the person to confirm their email when sign up returns no session", async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    const user = userEvent.setup();
    render(<AuthForm mode="signup" next={undefined} />);
    await user.type(screen.getByLabelText("Email"), "ada@example.org");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("validates before calling the server", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" next={undefined} />);
    await user.type(screen.getByLabelText("Email"), "nope");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });
});

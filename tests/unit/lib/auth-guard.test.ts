import { beforeEach, describe, expect, it, vi } from "vitest";

// redirect() は Next.js 内部で throw するため、モックでも throw させて本番挙動に合わせる
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { requireAdmin, requireSession } from "@/lib/auth-guard";

// ─── requireSession ────────────────────────────────────

describe("requireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合 redirect('/login') が呼ばれること", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("認証済みの場合 session が返ること", async () => {
    const mockSession = {
      user: { id: "user-id", name: "テスト", role: "user" },
    };
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

    const session = await requireSession();

    expect(session).toEqual(mockSession);
    expect(redirect).not.toHaveBeenCalled();
  });
});

// ─── requireAdmin ─────────────────────────────────────

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合 redirect('/login') が呼ばれること", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("一般ユーザー(role: user)の場合 redirect('/') が呼ばれること", async () => {
    const mockSession = {
      user: { id: "user-id", name: "一般ユーザー", role: "user" },
    };
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("admin ユーザーの場合 session が返ること", async () => {
    const mockSession = {
      user: { id: "admin-id", name: "管理者", role: "admin" },
    };
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as never);

    const session = await requireAdmin();

    expect(session).toEqual(mockSession);
    expect(redirect).not.toHaveBeenCalled();
  });
});

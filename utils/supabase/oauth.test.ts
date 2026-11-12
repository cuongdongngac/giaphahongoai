import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { User } from "@supabase/supabase-js";
import {
  OAUTH_ERROR_CODES,
  OAUTH_ERROR_MESSAGES,
  OAUTH_NEW_ACCOUNT_WINDOW_MS,
  hasEmailIdentity,
  isNewOAuthSignup,
} from "./oauth.ts";

const NOW = new Date("2026-11-12T10:00:00.000Z");

function makeUser(createdAt: string, providers: string[]): User {
  return {
    created_at: createdAt,
    identities: providers.map((provider) => ({ provider })),
  } as unknown as User;
}

describe("Google login chỉ cho email có sẵn (chặn đăng ký mới)", () => {
  it("chặn: tài khoản Google vừa được tạo (email lạ)", () => {
    const user = makeUser(NOW.toISOString(), ["google"]);
    assert.equal(isNewOAuthSignup(user, NOW), true);
  });

  it("cho phép: tài khoản Google đã có từ lâu", () => {
    const user = makeUser("2026-01-01T00:00:00.000Z", ["google"]);
    assert.equal(isNewOAuthSignup(user, NOW), false);
  });

  it("cho phép: vừa đăng ký email/mật khẩu rồi link Google ngay", () => {
    const justCreated = new Date(
      NOW.getTime() - 30 * 1000,
    ).toISOString();
    const user = makeUser(justCreated, ["email", "google"]);
    assert.equal(hasEmailIdentity(user), true);
    assert.equal(isNewOAuthSignup(user, NOW), false);
  });

  it("cho phép: tài khoản cũ đã link cả email và Google", () => {
    const user = makeUser("2025-06-01T00:00:00.000Z", [
      "email",
      "google",
    ]);
    assert.equal(isNewOAuthSignup(user, NOW), false);
  });

  it("ranh giới: trong cửa sổ 10 phút thì chặn, ngoài thì cho phép", () => {
    const inside = new Date(
      NOW.getTime() - OAUTH_NEW_ACCOUNT_WINDOW_MS + 1000,
    ).toISOString();
    const outside = new Date(
      NOW.getTime() - OAUTH_NEW_ACCOUNT_WINDOW_MS - 1000,
    ).toISOString();
    assert.equal(
      isNewOAuthSignup(makeUser(inside, ["google"]), NOW),
      true,
    );
    assert.equal(
      isNewOAuthSignup(makeUser(outside, ["google"]), NOW),
      false,
    );
  });

  it("fail-open: created_at không hợp lệ thì không chặn", () => {
    const user = makeUser("not-a-date", ["google"]);
    assert.equal(isNewOAuthSignup(user, NOW), false);
  });

  it("mọi mã lỗi OAuth đều có thông điệp tiếng Việt", () => {
    for (const code of Object.values(OAUTH_ERROR_CODES)) {
      const message = OAUTH_ERROR_MESSAGES[code];
      assert.ok(
        typeof message === "string" && message.length > 0,
        `thiếu thông điệp cho mã ${code}`,
      );
    }
  });
});

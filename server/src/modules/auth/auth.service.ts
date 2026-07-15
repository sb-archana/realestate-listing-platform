import { prisma } from "../../lib/prisma";
import { hashPassword, comparePassword } from "../../lib/password";
import { signAccessToken, generateRefreshToken, hashToken } from "../../lib/jwt";
import { AppError } from "../../utils/AppError";
import type { LoginInput, RegisterInput } from "./auth.schema";

function toPublicUser(user: { id: string; name: string; email: string; phone: string | null }) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone };
}

async function issueTokenPair(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email });
  const { raw, tokenHash, expiresAt } = generateRefreshToken();
  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  return { accessToken, refreshToken: raw };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, phone: input.phone },
  });
  const tokens = await issueTokenPair(user.id, user.email);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }
  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized("Invalid email or password");
  }
  const tokens = await issueTokenPair(user.id, user.email);
  return { user: toPublicUser(user), ...tokens };
}

/** Validates + rotates a refresh token: issues a new pair, revokes the old one. */
export async function refresh(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const tokens = await issueTokenPair(stored.userId, stored.user.email);
  return { user: toPublicUser(stored.user), ...tokens };
}

export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("User not found");
  return toPublicUser(user);
}

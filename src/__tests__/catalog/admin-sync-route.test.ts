import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const mockGetCurrentUser = vi.hoisted(() => vi.fn());
const mockRunLorcastSync = vi.hoisted(() => vi.fn());
const mockFindSyncRunById = vi.hoisted(() => vi.fn());
const mockFindAllSyncRuns = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/catalog/providers/lorcast.provider", () => ({
  LorcastCatalogProvider: class MockLorcastProvider {
    listSets = vi.fn().mockResolvedValue([]);
    listCardsBySet = vi.fn().mockResolvedValue([]);
    searchCards = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock("@/lib/catalog/sync/sync.service", () => ({
  runLorcastSync: mockRunLorcastSync,
}));

vi.mock("@/modules/sync/sync.repository", () => ({
  findSyncRunById: mockFindSyncRunById,
  findAllSyncRuns: mockFindAllSyncRuns,
  createSyncRun: vi.fn(),
  updateSyncRun: vi.fn(),
  createSyncError: vi.fn(),
}));

vi.mock("@/modules/admin/admin.repository", () => ({
  hasSyncRunning: vi.fn().mockResolvedValue(false),
  getAdminStats: vi.fn(),
  listUsers: vi.fn(),
  setUserRole: vi.fn(),
}));

import { POST } from "@/app/api/admin/sync/lorcast/route";
import { GET as GETRuns } from "@/app/api/admin/sync/runs/route";

const adminUser = {
  id: "user_001",
  name: "Admin",
  username: "admin",
  email: "admin@example.com",
  role: "ADMIN" as const,
  avatarUrl: null,
};

const regularUser = { ...adminUser, id: "user_002", role: "USER" as const };

const mockSyncRun = {
  id: "run_001",
  source: "lorcast",
  status: "SUCCESS",
  startedAt: new Date(),
  finishedAt: new Date(),
  setsCreated: 2,
  setsUpdated: 0,
  cardsCreated: 10,
  cardsUpdated: 0,
  cardsSkipped: 0,
  errorCount: 0,
  metadata: null,
  errors: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRunLorcastSync.mockResolvedValue("run_001");
  mockFindSyncRunById.mockResolvedValue(mockSyncRun);
  mockFindAllSyncRuns.mockResolvedValue([mockSyncRun]);
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/admin/sync/lorcast", () => {
  it("retorna 401 para usuário não autenticado", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("retorna 403 para usuário não administrador", async () => {
    mockGetCurrentUser.mockResolvedValue(regularUser);
    const res = await POST();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("executa sync e retorna 200 para administrador", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.syncRun).toBeDefined();
    expect(body.syncRun.id).toBe("run_001");
    expect(body.syncRun.status).toBe("SUCCESS");
  });
});

describe("GET /api/admin/sync/runs", () => {
  it("retorna 401 para usuário não autenticado", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await GETRuns();
    expect(res.status).toBe(401);
  });

  it("retorna 403 para usuário não administrador", async () => {
    mockGetCurrentUser.mockResolvedValue(regularUser);
    const res = await GETRuns();
    expect(res.status).toBe(403);
  });

  it("retorna lista de runs para administrador", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);
    const res = await GETRuns();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runs).toBeDefined();
    expect(Array.isArray(body.runs)).toBe(true);
  });
});

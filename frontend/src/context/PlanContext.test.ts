import { beforeEach, expect, test, vi } from "vitest";
import { salvarNoBackend } from "./PlanContext";
import Cookies from "js-cookie";
import api from "@/lib/api";

vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(() => null),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("salvarNoBackend não chama a API quando o usuário não está autenticado", async () => {
  const mockedGet = Cookies.get as ReturnType<typeof vi.fn>;
  mockedGet.mockReturnValue(null);

  const result = await salvarNoBackend({
    objetivo: null,
    pessoas: [],
    bancoEscolhido: null,
    aportesExtras: [],
    aportesRegularesEditados: {},
    aportesRegularesEditadosPorPessoa: {},
    mesesConcluidos: [],
  }, null);

  expect(result).toBeNull();
  expect(api.post).not.toHaveBeenCalled();
  expect(api.put).not.toHaveBeenCalled();
});

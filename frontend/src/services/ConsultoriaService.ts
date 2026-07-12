import api from "@/lib/api";

export class ConsultoriaService {
  // Não-streaming (legado)
  static async analisar(payload: any) {
    const response = await api.post("/consultoria/analisar", payload);
    return response.data;
  }

  /**
   * Streaming via SSE.
   * Chama o callback `onChunk` a cada trecho recebido e resolve quando o stream termina.
   * Lança erro se a requisição falhar antes de iniciar.
   */
  static async analisarStream(
    payload: any,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${api.defaults.baseURL}/consultoria/analisar/stream`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Erro ${response.status} ao iniciar stream da IA.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // guarda linha incompleta para próxima iteração

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice("data: ".length);
        if (data === "[DONE]") return;
        // Restaura quebras de linha escapadas pelo servidor
        onChunk(data.replace(/\\n/g, "\n"));
      }
    }
  }
}

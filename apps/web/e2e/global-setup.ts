import { execFileSync } from "node:child_process";

/**
 * Zera os limites por origem do banco local (sugestões e denúncias). Todas as
 * execuções saem do mesmo IP, então rodar os testes algumas vezes seguidas
 * esbarraria no limite de 5 sugestões por hora.
 */
export default function globalSetup() {
  try {
    execFileSync("docker", ["exec", "supabase_db_rowle", "psql", "-U", "postgres", "-qc", "truncate private.submission_attempts, private.report_attempts"], {
      stdio: "ignore",
    });
  } catch {
    // Sem Docker ou sem o banco local: os testes seguem e o limite vale como está.
  }
}

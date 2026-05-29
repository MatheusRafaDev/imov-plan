"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  { id: 1, label: "Etapa 1 – Dados iniciais", href: "/app/etapa1" },
  { id: 2, label: "Etapa 2 – Simulação", href: "/app/etapa2" },
  { id: 3, label: "Etapa 3 – Plano mensal", href: "/app/planejamento" },
  { id: 4, label: "Etapa 4 – Resultado", href: "/app/resultado" },
];

export default function Sidebar() {
  return (
    <nav className="hidden lg:block w-64 bg-white/5 backdrop-blur-md rounded-r-xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-white mb-4">Navegação</h2>
      <ul className="space-y-2">
        {steps.map((s) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className="flex items-center gap-2 text-sm text-white hover:text-primary transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

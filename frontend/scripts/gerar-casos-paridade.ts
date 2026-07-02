import * as fs from 'fs';
import * as path from 'path';
import { simular, SimInput } from '../src/lib/finance';

const cenarios: { name: string; input: Omit<SimInput, 'dataInicio'> & { dataInicio: string } }[] = [
    {
        name: "Cenario1_Basico",
        input: {
            valorImovel: 300000,
            percentualEntrada: 20,
            percentualCustosExtras: 5,
            valorJaGuardado: 10000,
            aporteMensalTotal: 1500,
            taxaCdiAnual: 10.5,
            percentualCdi: 100,
            aportesExtras: [],
            prazoMaxMeses: 360,
            dataInicio: "2025-01-01"
        }
    },
    {
        name: "Cenario2_PrazoCurto",
        input: {
            valorImovel: 500000,
            percentualEntrada: 20,
            percentualCustosExtras: 5,
            valorJaGuardado: 50000,
            aporteMensalTotal: 10000,
            taxaCdiAnual: 10.5,
            percentualCdi: 100,
            aportesExtras: [
                { data: "2025-06-01", valor: 20000, origem: "Bonus" }
            ],
            prazoMaxMeses: 60,
            dataInicio: "2025-01-01"
        }
    },
    {
        name: "Cenario3_SemPrazoDefinido",
        input: {
            valorImovel: 250000,
            percentualEntrada: 20,
            percentualCustosExtras: 5,
            valorJaGuardado: 0,
            aporteMensalTotal: 500,
            taxaCdiAnual: 8.5,
            percentualCdi: 100,
            aportesExtras: [],
            prazoMaxMeses: 600, // No backend será 600 ou o padrão (360). Colocando explícito para casar com backend.
            dataInicio: "2025-01-01"
        }
    }
];

function rodar() {
    const outputs = cenarios.map(c => {
        // Converte dataInicio de string para Date para a função simular
        const simInput: SimInput = {
            ...c.input,
            dataInicio: new Date(c.input.dataInicio + 'T12:00:00')
        };
        const result = simular(simInput);
        
        return {
            name: c.name,
            input: c.input, // Salva o input com string para o C# ler fácil
            output: {
                meta: result.meta,
                atingiuMeta: result.atingiuMeta,
                mesAtingiuMeta: result.mesAtingiuMeta,
                saldoFinal: result.saldoFinal,
                totalInvestido: result.totalInvestido
            }
        };
    });

    const outDir = path.join(__dirname, '..', 'tests', 'fixtures');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.join(outDir, 'casos-paridade.json');
    fs.writeFileSync(outFile, JSON.stringify(outputs, null, 2), 'utf-8');
    console.log(`[gerar-casos-paridade] Gerado arquivo ${outFile}`);
}

rodar();

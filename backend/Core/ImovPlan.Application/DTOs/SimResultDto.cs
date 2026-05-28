namespace ImovPlan.Application.DTOs
{
    public class SimRowDto
    {
        public int Mes { get; set; }
        public string Data { get; set; } = string.Empty; // ISO date
        public decimal AporteRegular { get; set; }
        public decimal AportesExtras { get; set; }
        public decimal RendimentoBruto { get; set; }
        public decimal Imposto { get; set; }
        public decimal RendimentoLiquido { get; set; }
        public decimal SaldoAcumulado { get; set; }
        public decimal TotalInvestido { get; set; }
    }

    public class SimResultDto
    {
        public decimal Meta { get; set; }
        public decimal CustosExtras { get; set; }
        public decimal ValorEntrada { get; set; }
        public decimal Falta { get; set; }
        public List<SimRowDto> Rows { get; set; } = new();
        public bool AtingiuMeta { get; set; }
        public int? MesAtingiuMeta { get; set; }
        public string? DataAtingiuMeta { get; set; }
        public decimal SaldoFinal { get; set; }
        public decimal TotalInvestido { get; set; }
        public decimal LucroLiquido { get; set; }
    }
}

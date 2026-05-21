using System.Collections.Generic;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Application.DTOs
{
    public class PlanoDraftDto
    {
        public string? Id { get; set; } // The MongoDB Id of ObjetivoImovel
        public string? SessionId { get; set; } // To link anonymous users
        
        public ObjetivoImovel? Objetivo { get; set; }
        public List<Pessoa> Pessoas { get; set; } = new();
    }
}

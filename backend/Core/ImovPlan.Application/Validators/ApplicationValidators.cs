using FluentValidation;
using ImovPlan.Application.DTOs;
using System;

namespace ImovPlan.Application.Validators
{
    public class AporteExtraDtoValidator : AbstractValidator<AporteExtraDto>
    {
        public AporteExtraDtoValidator()
        {
            RuleFor(x => x.Data).NotEmpty().WithMessage("A data do aporte extra é obrigatória.");
            RuleFor(x => x.Valor).GreaterThan(0).WithMessage("O valor do aporte extra deve ser maior que zero.");
            RuleFor(x => x.Origem).NotEmpty().WithMessage("A origem do aporte extra é obrigatória.");
        }
    }

    public class ConsultoriaRequestDtoValidator : AbstractValidator<ConsultoriaRequestDto>
    {
        public ConsultoriaRequestDtoValidator()
        {
            RuleFor(x => x.Pessoas).NotEmpty().WithMessage("É necessário informar ao menos uma pessoa.");
            RuleForEach(x => x.Pessoas).SetValidator(new PessoaConsultoriaDtoValidator());
            RuleFor(x => x.Renda_Total_Bruta).GreaterThanOrEqualTo(0).WithMessage("A renda total bruta não pode ser negativa.");
        }
    }

    public class PessoaConsultoriaDtoValidator : AbstractValidator<PessoaConsultoriaDto>
    {
        public PessoaConsultoriaDtoValidator()
        {
            RuleFor(x => x.Nome).NotEmpty().WithMessage("O nome da pessoa é obrigatório.");
            RuleFor(x => x.Renda_Mensal).GreaterThanOrEqualTo(0).WithMessage("A renda mensal não pode ser negativa.");
            RuleFor(x => x.Gastos_Totais_Calculados).GreaterThanOrEqualTo(0).WithMessage("Os gastos totais não podem ser negativos.");
        }
    }

    public class PessoaDtoValidator : AbstractValidator<PessoaDto>
    {
        public PessoaDtoValidator()
        {
            RuleFor(x => x.Nome).NotEmpty().WithMessage("O nome é obrigatório.");
            RuleFor(x => x.RendaMensal).GreaterThanOrEqualTo(0).WithMessage("A renda mensal não pode ser negativa.");
            RuleFor(x => x.GastosMensais).GreaterThanOrEqualTo(0).WithMessage("Os gastos mensais não podem ser negativos.");
        }
    }

    public class PlanoDraftDtoValidator : AbstractValidator<PlanoDraftDto>
    {
        public PlanoDraftDtoValidator()
        {
            RuleFor(x => x.Objetivo).NotNull().WithMessage("O objetivo é obrigatório.");
            When(x => x.Objetivo != null, () => {
                RuleFor(x => x.Objetivo!).SetValidator(new ObjetivoDraftDtoValidator());
            });
            
            RuleFor(x => x.Pessoas).NotEmpty().WithMessage("Ao menos uma pessoa deve ser informada no plano.");
            RuleForEach(x => x.Pessoas).SetValidator(new PessoaDraftDtoValidator());
            
            RuleForEach(x => x.AportesExtras).SetValidator(new AporteExtraDraftDtoValidator());
        }
    }

    public class ObjetivoDraftDtoValidator : AbstractValidator<ObjetivoDraftDto>
    {
        private static readonly HashSet<string> _ufsValidas = new(StringComparer.OrdinalIgnoreCase)
        {
            "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
            "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
            "RO","RR","RS","SC","SE","SP","TO"
        };

        public ObjetivoDraftDtoValidator()
        {
            RuleFor(x => x.ValorImovel).GreaterThanOrEqualTo(0).WithMessage("O valor do imóvel não pode ser negativo.");
            RuleFor(x => x.PercentualEntrada).InclusiveBetween(0, 100).WithMessage("O percentual de entrada deve estar entre 0 e 100.");
            RuleFor(x => x.ValorJaGuardado).GreaterThanOrEqualTo(0).WithMessage("O valor já guardado não pode ser negativo.");
            RuleFor(x => x.PrazoMaxMeses).GreaterThanOrEqualTo(0).WithMessage("O prazo máximo em meses não pode ser negativo.");

            When(x => !string.IsNullOrWhiteSpace(x.Estado), () =>
            {
                RuleFor(x => x.Estado)
                    .Must(uf => _ufsValidas.Contains(uf!))
                    .WithMessage("Estado inválido. Informe uma UF brasileira válida (ex: SP, RJ, MG).");

                RuleFor(x => x.Cidade)
                    .NotEmpty()
                    .WithMessage("Cidade é obrigatória quando o estado é informado.");
            });
        }
    }

    public class PessoaDraftDtoValidator : AbstractValidator<PessoaDraftDto>
    {
        public PessoaDraftDtoValidator()
        {
            RuleFor(x => x.Nome).NotEmpty().WithMessage("O nome da pessoa é obrigatório no rascunho.");
            RuleFor(x => x.Renda_mensal).GreaterThanOrEqualTo(0).WithMessage("A renda mensal não pode ser negativa.");
            RuleFor(x => x.Gastos_mensais).GreaterThanOrEqualTo(0).WithMessage("Os gastos mensais não podem ser negativos.");
        }
    }

    public class AporteExtraDraftDtoValidator : AbstractValidator<AporteExtraDraftDto>
    {
        public AporteExtraDraftDtoValidator()
        {
            RuleFor(x => x.Data).NotEmpty().WithMessage("A data do aporte extra é obrigatória.");
            RuleFor(x => x.Valor).GreaterThan(0).WithMessage("O valor do aporte extra deve ser maior que zero.");
        }
    }

    public class SimInputDtoValidator : AbstractValidator<SimInputDto>
    {
        public SimInputDtoValidator()
        {
            RuleFor(x => x.ValorImovel).GreaterThan(0).WithMessage("O valor do imóvel deve ser maior que zero.");
            RuleFor(x => x.PercentualEntrada).InclusiveBetween(0, 100).WithMessage("O percentual de entrada deve ser entre 0 e 100.");
            RuleFor(x => x.AporteMensalTotal).GreaterThanOrEqualTo(0).WithMessage("O aporte mensal total não pode ser negativo.");
        }
    }

    public class SimulacaoRequestDtoValidator : AbstractValidator<SimulacaoRequestDto>
    {
        public SimulacaoRequestDtoValidator()
        {
            RuleFor(x => x.ObjetivoId).NotEmpty().WithMessage("O ID do objetivo é obrigatório.");
            RuleFor(x => x.AportesMensais).NotEmpty().WithMessage("É obrigatório informar os aportes mensais.");
        }
    }

    public class ObjetivoImovelDtoValidator : AbstractValidator<ObjetivoImovelDto>
    {
        public ObjetivoImovelDtoValidator()
        {
            RuleFor(x => x.ValorImovel).GreaterThan(0).WithMessage("O valor do imóvel deve ser maior que zero.");
            RuleFor(x => x.PercentualEntrada).InclusiveBetween(0, 100).WithMessage("O percentual de entrada deve ser entre 0 e 100.");
            RuleFor(x => x.PrazoMeses).GreaterThan(0).WithMessage("O prazo deve ser maior que zero.");
        }
    }
}

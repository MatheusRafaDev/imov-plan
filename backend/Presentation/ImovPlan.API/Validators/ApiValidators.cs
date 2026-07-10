using FluentValidation;
using ImovPlan.API.Controllers;
using System;

namespace ImovPlan.API.Validators
{
    // Auth Validators
    public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
    {
        public RegisterRequestValidator()
        {
            RuleFor(x => x.Email).NotEmpty().WithMessage("Email é obrigatório.").EmailAddress().WithMessage("Formato de email inválido.");
            RuleFor(x => x.Password).NotEmpty().WithMessage("Senha é obrigatória.");
            RuleFor(x => x.Name).NotEmpty().WithMessage("Nome é obrigatório.");
            RuleFor(x => x.DataNascimento).NotEmpty().WithMessage("A data de nascimento é obrigatória.");
            
            When(x => !string.IsNullOrWhiteSpace(x.DataNascimento), () => {
                RuleFor(x => x.DataNascimento)
                    .Must(BeAValidDate).WithMessage("Formato de data de nascimento inválido.")
                    .Must(BePastDate).WithMessage("A data de nascimento não pode ser no futuro.")
                    .Must(BeAtLeast18).WithMessage("Você precisa ter pelo menos 18 anos para se cadastrar.")
                    .Must(BeUnder120).WithMessage("Insira uma data de nascimento válida.");
            });
        }

        private bool BeAValidDate(string? date) => DateTime.TryParse(date, out _);
        
        private bool BePastDate(string? date)
        {
            if (!DateTime.TryParse(date, out var parsed)) return false;
            return parsed <= DateTime.Today;
        }

        private bool BeAtLeast18(string? date)
        {
            if (!DateTime.TryParse(date, out var parsed)) return false;
            var age = DateTime.Today.Year - parsed.Year;
            if (parsed.Date > DateTime.Today.AddYears(-age)) age--;
            return age >= 18;
        }

        private bool BeUnder120(string? date)
        {
            if (!DateTime.TryParse(date, out var parsed)) return false;
            var age = DateTime.Today.Year - parsed.Year;
            if (parsed.Date > DateTime.Today.AddYears(-age)) age--;
            return age <= 120;
        }
    }

    public class LoginRequestValidator : AbstractValidator<LoginRequest>
    {
        public LoginRequestValidator()
        {
            RuleFor(x => x.Email).NotEmpty().WithMessage("Email é obrigatório.");
            RuleFor(x => x.Password).NotEmpty().WithMessage("Senha é obrigatória.");
        }
    }

    public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
    {
        public ForgotPasswordRequestValidator()
        {
            RuleFor(x => x.Email).NotEmpty().WithMessage("Email é obrigatório.").EmailAddress().WithMessage("Formato de email inválido.");
        }
    }

    public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
    {
        public ResetPasswordRequestValidator()
        {
            RuleFor(x => x.Email).NotEmpty().WithMessage("Email é obrigatório.").EmailAddress().WithMessage("Formato de email inválido.");
            RuleFor(x => x.Token).NotEmpty().WithMessage("Token é obrigatório.");
            RuleFor(x => x.NewPassword).NotEmpty().WithMessage("Nova senha é obrigatória.");
        }
    }

    // Financiamento Validators
    public class SimularRequestValidator : AbstractValidator<SimularRequest>
    {
        public SimularRequestValidator()
        {
            RuleFor(x => x.ValorFinanciado).GreaterThan(0).WithMessage("ValorFinanciado deve ser > 0.");
            RuleFor(x => x.PrazoMeses).GreaterThan(0).WithMessage("PrazoMeses deve ser > 0.");
            RuleFor(x => x.TaxaAnual).GreaterThanOrEqualTo(0).WithMessage("TaxaAnual deve ser >= 0.");
        }
    }

    public class CetRequestValidator : AbstractValidator<CetRequest>
    {
        public CetRequestValidator()
        {
            RuleFor(x => x.ValorFinanciado).GreaterThan(0).WithMessage("ValorFinanciado deve ser > 0.");
            RuleFor(x => x.PrazoMeses).GreaterThan(0).WithMessage("PrazoMeses deve ser > 0.");
            RuleFor(x => x.TaxaAnual).GreaterThanOrEqualTo(0).WithMessage("TaxaAnual deve ser >= 0.");
            RuleFor(x => x.TaxaMip).GreaterThanOrEqualTo(0).WithMessage("TaxaMip deve ser >= 0.");
            RuleFor(x => x.TaxaDfi).GreaterThanOrEqualTo(0).WithMessage("TaxaDfi deve ser >= 0.");
            RuleFor(x => x.TaxaAdmin).GreaterThanOrEqualTo(0).WithMessage("TaxaAdmin deve ser >= 0.");
        }
    }

    public class FgtsRequestValidator : AbstractValidator<FgtsRequest>
    {
        public FgtsRequestValidator()
        {
            RuleFor(x => x.SaldoDevedor).GreaterThanOrEqualTo(0).WithMessage("SaldoDevedor deve ser >= 0.");
            RuleFor(x => x.SaldoFgts).GreaterThanOrEqualTo(0).WithMessage("SaldoFgts deve ser >= 0.");
            RuleFor(x => x.ParcelaAtual).GreaterThanOrEqualTo(0).WithMessage("ParcelaAtual deve ser >= 0.");
            RuleFor(x => x.PrazoRestante).GreaterThan(0).WithMessage("PrazoRestante deve ser > 0.");
        }
    }

    public class ComprometimentoRequestValidator : AbstractValidator<ComprometimentoRequest>
    {
        public ComprometimentoRequestValidator()
        {
            RuleFor(x => x.RendaBrutaFamiliar).GreaterThan(0).WithMessage("RendaBrutaFamiliar deve ser > 0.");
            RuleFor(x => x.ParcelaCalculada).GreaterThanOrEqualTo(0).WithMessage("ParcelaCalculada deve ser >= 0.");
        }
    }

    // Usuario Validators
    public class UpdateUsuarioRequestValidator : AbstractValidator<UpdateUsuarioRequest>
    {
        public UpdateUsuarioRequestValidator()
        {
            When(x => !string.IsNullOrWhiteSpace(x.DataNascimento), () => {
                RuleFor(x => x.DataNascimento)
                    .Must(BeAValidDate).WithMessage("Formato de data de nascimento inválido.")
                    .Must(BePastDate).WithMessage("A data de nascimento não pode ser no futuro.")
                    .Must(BeAtLeast18).WithMessage("Você precisa ter pelo menos 18 anos para se cadastrar.")
                    .Must(BeUnder120).WithMessage("Insira uma data de nascimento válida.");
            });
        }

        private bool BeAValidDate(string? date) => DateTime.TryParse(date, out _);
        
        private bool BePastDate(string? date)
        {
            if (!DateTime.TryParse(date, out var parsed)) return false;
            return parsed <= DateTime.Today;
        }

        private bool BeAtLeast18(string? date)
        {
            if (!DateTime.TryParse(date, out var parsed)) return false;
            var age = DateTime.Today.Year - parsed.Year;
            if (parsed.Date > DateTime.Today.AddYears(-age)) age--;
            return age >= 18;
        }

        private bool BeUnder120(string? date)
        {
            if (!DateTime.TryParse(date, out var parsed)) return false;
            var age = DateTime.Today.Year - parsed.Year;
            if (parsed.Date > DateTime.Today.AddYears(-age)) age--;
            return age <= 120;
        }
    }
}

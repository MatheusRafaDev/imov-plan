using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using FluentValidation;

namespace ImovPlan.API.Filters
{
    public class ValidationFilterAttribute : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            var arguments = context.ActionArguments.Values.Where(v => v != null);

            foreach (var argument in arguments)
            {
                var argumentType = argument!.GetType();
                
                // Ignorar tipos primitivos, strings, etc. Focar apenas em classes/DTOs.
                if (argumentType.IsPrimitive || argumentType == typeof(string) || argumentType.IsValueType)
                    continue;

                var validatorType = typeof(IValidator<>).MakeGenericType(argumentType);
                var validator = context.HttpContext.RequestServices.GetService(validatorType) as IValidator;
                
                if (validator != null)
                {
                    var validationContextType = typeof(ValidationContext<>).MakeGenericType(argumentType);
                    var validationContext = Activator.CreateInstance(validationContextType, argument) as IValidationContext;
                    
                    if (validationContext != null)
                    {
                        var validationResult = validator.Validate(validationContext);

                        if (!validationResult.IsValid)
                        {
                            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();

                            // Log detailed validation errors
                            var logger = context.HttpContext.RequestServices.GetService<Microsoft.Extensions.Logging.ILogger<ValidationFilterAttribute>>();
                            logger?.LogWarning("Validation failed for {Type}: {Errors}", argumentType.Name, string.Join(", ", errors));

                            context.Result = new BadRequestObjectResult(new
                            {
                                message = "Erros de validação encontrados.",
                                errors = errors
                            });
                            return; // Interrompe e retorna HTTP 400
                        }
                    }
                }
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // Nenhuma ação necessária após a execução
        }
    }
}

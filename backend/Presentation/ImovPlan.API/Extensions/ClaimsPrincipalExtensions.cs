using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace ImovPlan.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static string? GetUsuarioId(this ClaimsPrincipal user)
        {
            if (user == null)
                return null;

            return user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        }
    }
}

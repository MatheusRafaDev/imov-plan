namespace ImovPlan.Application.Services.Interfaces
{
    public interface ITokenService
    {
        string GenerateJwtToken(string userId, string role);
    }
}
using System.Threading.Tasks;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface ILocationProvider
    {
        Task<AddressDto?> GetAddressByCepAsync(string cep);
    }

    public class AddressDto
    {
        public string Cep { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string Neighborhood { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
    }
}

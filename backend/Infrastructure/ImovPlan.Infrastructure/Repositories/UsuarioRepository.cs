using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly AppDbContext _context;

        public UsuarioRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Usuario?> GetByIdAsync(string id)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<Usuario?> GetByEmailAsync(string email)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<Usuario?> GetByResetTokenHashAsync(string tokenHash)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.ResetPasswordToken == tokenHash);
        }

        public async Task<Usuario> CreateAsync(Usuario usuario)
        {
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            return usuario;
        }

        public async Task UpdateAsync(string id, Usuario usuario)
        {
            var existing = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
            if (existing != null)
            {
                existing.Nome = usuario.Nome;
                existing.Email = usuario.Email;
                existing.PasswordHash = usuario.PasswordHash;
                existing.DataNascimento = usuario.DataNascimento;
                existing.TipoInvestimento = usuario.TipoInvestimento;
                existing.Role = usuario.Role;
                existing.Provider = usuario.Provider;
                // Campos de recuperação de senha
                existing.ResetPasswordToken = usuario.ResetPasswordToken;
                existing.ResetPasswordExpiry = usuario.ResetPasswordExpiry;
                existing.ResetPasswordTokenUsed = usuario.ResetPasswordTokenUsed;
                _context.Usuarios.Update(existing);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteAsync(string id)
        {
            var existing = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
            if (existing != null)
            {
                _context.Usuarios.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }
    }
}


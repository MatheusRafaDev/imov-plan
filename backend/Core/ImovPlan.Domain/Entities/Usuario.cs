using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class Usuario
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; } = string.Empty;

        [BsonElement("dataNascimento")]
        public DateTime? DataNascimento { get; set; }

        [BsonElement("tipoInvestimento")]
        public string? TipoInvestimento { get; set; }

        [BsonElement("role")]
        public string? Role { get; set; }

        /// <summary>
        /// Origem da conta: "local" (senha), "google" (somente Google), "both" (Google + senha local).
        /// Usuários existentes sem este campo são tratados como "local".
        /// </summary>
        [BsonElement("provider")]
        public string? Provider { get; set; }

        /// <summary>
        /// Hash SHA-256 do token de recuperação de senha (nunca armazenado em texto puro).
        /// </summary>
        [BsonElement("resetPasswordToken")]
        public string? ResetPasswordToken { get; set; }

        [BsonElement("resetPasswordExpiry")]
        public DateTime? ResetPasswordExpiry { get; set; }

        /// <summary>
        /// Indica se o token de recuperação já foi utilizado, impedindo reutilização do link.
        /// Nullable para compatibilidade com documentos existentes sem este campo (null == false).
        /// </summary>
        [BsonElement("resetPasswordTokenUsed")]
        public bool? ResetPasswordTokenUsed { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}


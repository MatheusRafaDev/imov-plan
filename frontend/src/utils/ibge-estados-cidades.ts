export type Estado = {
  uf: string;
  nome: string;
};

export type Cidade = {
  nome: string;
};

export const estados: Estado[] = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "PR", nome: "Paraná" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "TO", nome: "Tocantins" },
];

export const cidadesPorEstado: Record<string, Cidade[]> = {
  AC: [{ nome: "Rio Branco" }, { nome: "Cruzeiro do Sul" }, { nome: "Sena Madureira" }, { nome: "Outra cidade" }],
  AL: [{ nome: "Maceió" }, { nome: "Arapiraca" }, { nome: "Palmeira dos Índios" }, { nome: "Outra cidade" }],
  AM: [{ nome: "Manaus" }, { nome: "Parintins" }, { nome: "Itacoatiara" }, { nome: "Manacapuru" }, { nome: "Outra cidade" }],
  AP: [{ nome: "Macapá" }, { nome: "Santana" }, { nome: "Laranjal do Jari" }, { nome: "Outra cidade" }],
  BA: [{ nome: "Salvador" }, { nome: "Feira de Santana" }, { nome: "Vitória da Conquista" }, { nome: "Camaçari" }, { nome: "Itabuna" }, { nome: "Ilhéus" }, { nome: "Outra cidade" }],
  CE: [{ nome: "Fortaleza" }, { nome: "Caucaia" }, { nome: "Juazeiro do Norte" }, { nome: "Maracanaú" }, { nome: "Sobral" }, { nome: "Outra cidade" }],
  DF: [{ nome: "Brasília" }, { nome: "Outra cidade" }],
  ES: [{ nome: "Vitória" }, { nome: "Vila Velha" }, { nome: "Serra" }, { nome: "Cariacica" }, { nome: "Cachoeiro de Itapemirim" }, { nome: "Outra cidade" }],
  GO: [{ nome: "Goiânia" }, { nome: "Aparecida de Goiânia" }, { nome: "Anápolis" }, { nome: "Rio Verde" }, { nome: "Luziânia" }, { nome: "Outra cidade" }],
  MA: [{ nome: "São Luís" }, { nome: "Imperatriz" }, { nome: "São José de Ribamar" }, { nome: "Timon" }, { nome: "Outra cidade" }],
  MG: [{ nome: "Belo Horizonte" }, { nome: "Uberlândia" }, { nome: "Contagem" }, { nome: "Juiz de Fora" }, { nome: "Betim" }, { nome: "Montes Claros" }, { nome: "Ribeirão das Neves" }, { nome: "Uberaba" }, { nome: "Governador Valadares" }, { nome: "Ipatinga" }, { nome: "Outra cidade" }],
  MS: [{ nome: "Campo Grande" }, { nome: "Dourados" }, { nome: "Três Lagoas" }, { nome: "Corumbá" }, { nome: "Outra cidade" }],
  MT: [{ nome: "Cuiabá" }, { nome: "Várzea Grande" }, { nome: "Rondonópolis" }, { nome: "Sinop" }, { nome: "Tangará da Serra" }, { nome: "Outra cidade" }],
  PA: [{ nome: "Belém" }, { nome: "Ananindeua" }, { nome: "Santarém" }, { nome: "Marabá" }, { nome: "Castanhal" }, { nome: "Outra cidade" }],
  PB: [{ nome: "João Pessoa" }, { nome: "Campina Grande" }, { nome: "Santa Rita" }, { nome: "Patos" }, { nome: "Outra cidade" }],
  PE: [{ nome: "Recife" }, { nome: "Caruaru" }, { nome: "Olinda" }, { nome: "Petrolina" }, { nome: "Jaboatão dos Guararapes" }, { nome: "Paulista" }, { nome: "Outra cidade" }],
  PI: [{ nome: "Teresina" }, { nome: "Parnaíba" }, { nome: "Picos" }, { nome: "Piripiri" }, { nome: "Outra cidade" }],
  PR: [{ nome: "Curitiba" }, { nome: "Londrina" }, { nome: "Maringá" }, { nome: "Ponta Grossa" }, { nome: "Cascavel" }, { nome: "São José dos Pinhais" }, { nome: "Foz do Iguaçu" }, { nome: "Outra cidade" }],
  RJ: [{ nome: "Rio de Janeiro" }, { nome: "São Gonçalo" }, { nome: "Duque de Caxias" }, { nome: "Nova Iguaçu" }, { nome: "Niterói" }, { nome: "Belford Roxo" }, { nome: "São João de Meriti" }, { nome: "Petrópolis" }, { nome: "Volta Redonda" }, { nome: "Macaé" }, { nome: "Outra cidade" }],
  RN: [{ nome: "Natal" }, { nome: "Mossoró" }, { nome: "Parnamirim" }, { nome: "Caicó" }, { nome: "Outra cidade" }],
  RO: [{ nome: "Porto Velho" }, { nome: "Ji-Paraná" }, { nome: "Ariquemes" }, { nome: "Vilhena" }, { nome: "Outra cidade" }],
  RR: [{ nome: "Boa Vista" }, { nome: "Caracaraí" }, { nome: "Outra cidade" }],
  RS: [{ nome: "Porto Alegre" }, { nome: "Caxias do Sul" }, { nome: "Canoas" }, { nome: "Pelotas" }, { nome: "Santa Maria" }, { nome: "Gravataí" }, { nome: "Viamão" }, { nome: "Novo Hamburgo" }, { nome: "São Leopoldo" }, { nome: "Rio Grande" }, { nome: "Outra cidade" }],
  SC: [{ nome: "Florianópolis" }, { nome: "Joinville" }, { nome: "Blumenau" }, { nome: "São José" }, { nome: "Chapecó" }, { nome: "Criciúma" }, { nome: "Itajaí" }, { nome: "Jaraguá do Sul" }, { nome: "Palhoça" }, { nome: "Balneário Camboriú" }, { nome: "Outra cidade" }],
  SE: [{ nome: "Aracaju" }, { nome: "Nossa Senhora do Socorro" }, { nome: "Lagarto" }, { nome: "Itabaiana" }, { nome: "Outra cidade" }],
  SP: [{ nome: "São Paulo" }, { nome: "Guarulhos" }, { nome: "Campinas" }, { nome: "São Bernardo do Campo" }, { nome: "Santo André" }, { nome: "Osasco" }, { nome: "São José dos Campos" }, { nome: "Ribeirão Preto" }, { nome: "Sorocaba" }, { nome: "Mauá" }, { nome: "Santos" }, { nome: "Mogi das Cruzes" }, { nome: "Diadema" }, { nome: "Jundiaí" }, { nome: "Piracicaba" }, { nome: "Carapicuíba" }, { nome: "Bauru" }, { nome: "Itaquaquecetuba" }, { nome: "São José do Rio Preto" }, { nome: "Franca" }, { nome: "Guarujá" }, { nome: "Limeira" }, { nome: "Praia Grande" }, { nome: "Taubaté" }, { nome: "Barueri" }, { nome: "Suzano" }, { nome: "Taboão da Serra" }, { nome: "Outra cidade" }],
  TO: [{ nome: "Palmas" }, { nome: "Araguaína" }, { nome: "Gurupi" }, { nome: "Porto Nacional" }, { nome: "Outra cidade" }],
};

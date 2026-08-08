export type FieldType = "text" | "number" | "date" | "choice" | "boolean";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
};

export type SectionDef = {
  id: string;
  title: string;
  hint: string;
  fields: FieldDef[];
};

export const SECTIONS: SectionDef[] = [
  {
    id: "socios",
    title: "Sócios",
    hint: "Fale os dados pessoais dos sócios: regime de casamento, senha GOV, e-mail e telefone.",
    fields: [
      { key: "tipoEmpresa", label: "Tipo de empresa", type: "choice", options: ["LTDA", "Empresário"] },
      { key: "regimeCasamento", label: "Regime de casamento", type: "text" },
      { key: "senhaGov", label: "Senha GOV", type: "text" },
      { key: "emailSocio", label: "E-mail do sócio", type: "text" },
      { key: "telefoneSocios", label: "Telefone dos sócios", type: "text" },
    ],
  },
  {
    id: "empresa",
    title: "Empresa",
    hint: "Fale o nome empresarial, nome fantasia, atividades e data de início.",
    fields: [
      {
        key: "tipoSociedade",
        label: "Tipo de sociedade",
        type: "choice",
        options: ["Sociedade Limitada", "Sociedade Unipessoal Limitada"],
      },
      { key: "nomeEmpresarial", label: "Nome empresarial", type: "text" },
      { key: "nomeFantasia", label: "Nome fantasia", type: "text" },
      { key: "atividadePrincipal", label: "Atividade principal (CNAE)", type: "text" },
      {
        key: "atividadesSecundarias",
        label: "Atividades secundárias (CNAEs)",
        type: "text",
        placeholder: "Códigos separados por vírgula",
      },
      { key: "dataInicio", label: "Data de início de atividade", type: "date" },
    ],
  },
  {
    id: "capital",
    title: "Capital e quotas",
    hint: "Fale o capital social, integralização e a divisão entre os sócios.",
    fields: [
      { key: "capitalTotal", label: "Capital social total (R$)", type: "number" },
      { key: "capitalIntegralizado", label: "Capital integralizado (R$)", type: "number" },
      { key: "capitalMoeda", label: "Em moeda corrente (R$)", type: "number" },
      { key: "capitalBens", label: "Em bens móveis ou imóveis (R$)", type: "number" },
      {
        key: "distribuicaoQuotas",
        label: "Distribuição das quotas",
        type: "text",
        placeholder: "Ex.: João 60% administrador; Maria 40%",
      },
      { key: "assinaIsoladamente", label: "Assina isoladamente", type: "boolean" },
    ],
  },
  {
    id: "tributacao",
    title: "Tributação e contato",
    hint: "Fale o horário de funcionamento, a forma e o regime de tributação e os contatos do CNPJ.",
    fields: [
      { key: "horarioFuncionamento", label: "Horário de funcionamento", type: "choice", options: ["Normal", "Especial"] },
      {
        key: "formaTributacao",
        label: "Forma de tributação",
        type: "choice",
        options: ["Simples Nacional", "Lucro Presumido", "Lucro Real"],
      },
      { key: "regimeTributacao", label: "Regime de tributação", type: "choice", options: ["Competência", "Caixa"] },
      { key: "emailCnpj", label: "E-mail do CNPJ", type: "text" },
      { key: "telefoneCnpj", label: "Telefone do CNPJ", type: "text" },
    ],
  },
  {
    id: "imovel",
    title: "Imóvel",
    hint: "Fale sobre o estabelecimento, as áreas em m² e o CCI.",
    fields: [
      {
        key: "estabelecimento",
        label: "Estabelecimento",
        type: "choice",
        options: ["Com estabelecimento", "Sem estabelecimento - Endereço residencial"],
      },
      { key: "areaImovel", label: "Área do imóvel (m²)", type: "number" },
      { key: "areaEstabelecimento", label: "Área do estabelecimento (m²)", type: "number" },
      { key: "cci", label: "CCI (Cód. Cad. do Imóvel)", type: "text" },
    ],
  },
];

export const ALL_FIELDS: FieldDef[] = SECTIONS.flatMap((s) => s.fields);

export type FormValues = Record<string, string>;

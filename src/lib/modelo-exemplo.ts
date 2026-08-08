import type { Estrutura } from "./estrutura";

/** Modelo de exemplo: ficha de abertura de empresa (contabilidade). */
export const MODELO_EXEMPLO: { nome: string; descricao: string; estrutura: Estrutura } = {
  nome: "Ficha de abertura de empresa",
  descricao: "Modelo de exemplo com os dados de abertura e alteração de empresa.",
  estrutura: [
    {
      id: "socios",
      titulo: "Sócios",
      dica: "Fale o tipo de empresa, regime de casamento, senha GOV, e-mail e telefone dos sócios.",
      campos: [
        { chave: "tipo_empresa", rotulo: "Tipo de empresa", tipo: "opcao", opcoes: ["LTDA", "Empresário"] },
        { chave: "regime_casamento", rotulo: "Regime de casamento", tipo: "texto" },
        { chave: "senha_gov", rotulo: "Senha GOV", tipo: "texto" },
        { chave: "email_socio", rotulo: "E-mail do sócio", tipo: "texto" },
        { chave: "telefone_socios", rotulo: "Telefone dos sócios", tipo: "texto" },
      ],
    },
    {
      id: "empresa",
      titulo: "Empresa",
      dica: "Fale o nome empresarial, nome fantasia, atividades (CNAE) e a data de início.",
      campos: [
        {
          chave: "tipo_sociedade",
          rotulo: "Tipo de sociedade",
          tipo: "opcao",
          opcoes: ["Sociedade Limitada", "Sociedade Unipessoal Limitada"],
        },
        { chave: "nome_empresarial", rotulo: "Nome empresarial", tipo: "texto", longo: true },
        { chave: "nome_fantasia", rotulo: "Nome fantasia", tipo: "texto", longo: true },
        { chave: "atividade_principal", rotulo: "Atividade principal (CNAE)", tipo: "texto" },
        { chave: "atividades_secundarias", rotulo: "Atividades secundárias (CNAEs)", tipo: "texto", longo: true },
        { chave: "data_inicio", rotulo: "Data de início de atividade", tipo: "data" },
      ],
    },
    {
      id: "capital",
      titulo: "Capital e quotas",
      dica: "Fale o capital social, a integralização e a divisão entre os sócios.",
      campos: [
        { chave: "capital_total", rotulo: "Capital social total (R$)", tipo: "numero" },
        { chave: "capital_integralizado", rotulo: "Capital integralizado (R$)", tipo: "numero" },
        { chave: "capital_moeda", rotulo: "Em moeda corrente (R$)", tipo: "numero" },
        { chave: "capital_bens", rotulo: "Em bens móveis ou imóveis (R$)", tipo: "numero" },
        { chave: "distribuicao_quotas", rotulo: "Distribuição das quotas", tipo: "texto", longo: true },
        { chave: "assina_isoladamente", rotulo: "Assina isoladamente", tipo: "simnao" },
      ],
    },
    {
      id: "tributacao",
      titulo: "Tributação e contato",
      dica: "Fale o horário de funcionamento, a forma e o regime de tributação e os contatos do CNPJ.",
      campos: [
        { chave: "horario_funcionamento", rotulo: "Horário de funcionamento", tipo: "opcao", opcoes: ["Normal", "Especial"] },
        {
          chave: "forma_tributacao",
          rotulo: "Forma de tributação",
          tipo: "opcao",
          opcoes: ["Simples Nacional", "Lucro Presumido", "Lucro Real"],
        },
        { chave: "regime_tributacao", rotulo: "Regime de tributação", tipo: "opcao", opcoes: ["Competência", "Caixa"] },
        { chave: "email_cnpj", rotulo: "E-mail do CNPJ", tipo: "texto" },
        { chave: "telefone_cnpj", rotulo: "Telefone do CNPJ", tipo: "texto" },
      ],
    },
    {
      id: "imovel",
      titulo: "Imóvel",
      dica: "Fale sobre o estabelecimento, as áreas em m² e o CCI.",
      campos: [
        {
          chave: "estabelecimento",
          rotulo: "Estabelecimento",
          tipo: "opcao",
          opcoes: ["Com estabelecimento", "Sem estabelecimento (residencial)"],
        },
        { chave: "area_imovel", rotulo: "Área do imóvel (m²)", tipo: "numero" },
        { chave: "area_estabelecimento", rotulo: "Área do estabelecimento (m²)", tipo: "numero" },
        { chave: "cci", rotulo: "CCI (Cód. Cad. do Imóvel)", tipo: "texto" },
      ],
    },
  ],
};

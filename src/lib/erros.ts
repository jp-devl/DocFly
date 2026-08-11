/** Traduz mensagens de erro (auth, rede, banco) para português do Brasil. */
const REGRAS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar."],
  [/user already registered|already been registered/i, "Esse e-mail já tem uma conta. Faça login."],
  [/password should be at least (\d+)/i, "A senha precisa ter pelo menos $1 caracteres."],
  [/password.*(weak|pwned|compromised|leaked)/i, "Escolha uma senha mais forte."],
  [/unable to validate email address|invalid email/i, "Digite um e-mail válido."],
  [/signups? (not allowed|is disabled|are disabled)/i, "O cadastro de novas contas está desativado."],
  [/email (rate limit|send rate)|over_email_send_rate_limit/i,
    "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo."],
  [/rate limit|too many requests/i, "Muitas tentativas. Espere um pouco e tente novamente."],
  [/error sending confirmation email|error sending email/i,
    "Não consegui enviar o e-mail de confirmação. Tente novamente em instantes."],
  [/token has expired|expired/i, "O link expirou. Peça um novo."],
  [/session (from session_id claim in JWT does not exist|not found)|jwt expired|refresh token/i,
    "Sua sessão expirou. Entre novamente."],
  [/unsupported provider|provider is not enabled/i, "Esse modo de entrar não está disponível agora."],
  [/user not found/i, "Não encontrei uma conta com esse e-mail."],
  [/new password should be different/i, "A nova senha precisa ser diferente da atual."],
  [/network|failed to fetch|load failed/i, "Sem conexão com a internet. Verifique sua rede."],
  [/duplicate key|already exists/i, "Esse registro já existe."],
  [/row-level security|permission denied|not authorized|unauthorized/i,
    "Você não tem permissão para fazer isso."],
  [/payload too large|file too large/i, "O arquivo é grande demais."],
  [/timeout|timed out/i, "A operação demorou demais. Tente de novo."],
];

export function mensagemErro(erro: unknown, padrao = "Algo deu errado. Tente novamente."): string {
  const texto =
    erro instanceof Error ? erro.message : typeof erro === "string" ? erro : "";
  if (!texto) return padrao;
  for (const [regex, traducao] of REGRAS) {
    if (regex.test(texto)) return texto.replace(regex, traducao);
  }
  // Se a mensagem parece estar em inglês, evita mostrar texto técnico ao usuário.
  return /[a-z]/i.test(texto) && !/[áàâãéêíóôõúçÁÂÃÉÊÍÓÔÕÚÇ]/.test(texto) ? padrao : texto;
}

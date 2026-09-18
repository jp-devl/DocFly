# Plano: preservar documentos e refinar a experiência

## Objetivo
Fazer o DocFly tratar o arquivo enviado como a fonte visual definitiva em PDF, Word e imagem, alterando somente os campos identificados, e refinar a página inicial e a biblioteca de modelos conforme o briefing.

## Implementação
1. Auditar o fluxo completo de leitura, armazenamento, preenchimento e download para eliminar qualquer caminho que recrie o documento quando o original puder ser usado.
2. PDF: manter cada página original intacta como base, armazenar áreas dos campos e substituir apenas o conteúdo dessas áreas, com ajuste de texto para não invadir campos vizinhos.
3. Word: editar os elementos existentes no DOCX, preservando estilos, imagens, tabelas, cabeçalhos, rodapés e demais partes não identificadas como campos.
4. Imagem/foto: manter a imagem original como fundo integral da página, mapear as áreas preenchíveis e desenhar somente os novos valores nessas áreas; o resultado será exportado como PDF preenchido.
5. Separar explicitamente campos editáveis de elementos visuais durante a análise, para fotos, logos, formas, cores e ícones nunca serem tratados como lacunas.
6. Refinar a página inicial: ampliar a demonstração animada, variar o formato das seções, fortalecer o fluxo original → DocFly → final e mostrar exemplos com aparência de documentos reais.
7. Refinar Meus modelos: explicar o conceito de modelo, transformar o estado vazio em orientação acionável e apresentar modelos salvos como uma biblioteca visual com miniatura, tipo, campos, última atividade e ações.
8. Validar upload, preenchimento e download dos três formatos, além da apresentação em desktop e celular.

## Regra de produto
- O arquivo original é a fonte de verdade.
- Somente áreas identificadas como campos preenchíveis podem ser modificadas.
- Elementos visuais fazem parte do documento e devem permanecer intactos.
- Quando um formato não puder ser editado diretamente, ele será preservado visualmente como base, sem reconstrução do layout.

## Resultado esperado
O usuário envia um documento real, fala as respostas e baixa o mesmo documento visualmente preservado, agora preenchido, enquanto a interface explica e demonstra essa promessa com clareza.

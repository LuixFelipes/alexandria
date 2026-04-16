# ⚙️ Fluxos de Negócio

Lógica de funcionamento operacional da [[Arquitetura do Sistema|Alexandria]].

## Ciclo de Vida do Empréstimo
1. **Solicitação**: Verifica se o [[Entidades e Banco de Dados|Papiro]] está `disponivel`.
2. **Cessão**: Registra data de retirada e previsão de devolução.
3. **Renovação**: Estende o prazo em 7, 14 ou mais dias através de confirmação de segurança.
4. **Devolução**: Libera o item para o Catálogo e encerra o registro no Histórico.

## Segurança e Confirmação
Todas as alterações no sistema passam por um **Protocolo de Confirmação** (Custom Modals) para evitar erros no acervo.

---
[[Entidades e Banco de Dados|Ver Tabelas]] | [[Alexandria_Mapa|Voltar ao Início]]

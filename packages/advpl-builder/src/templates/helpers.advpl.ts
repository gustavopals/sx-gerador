/**
 * Conteúdo do arquivo SXG_HELPERS.PRW.
 *
 * Este helper define as funções auxiliares usadas pelas migrations:
 *   - U_SXGCriaSX2: cria/atualiza entrada na SX2 (tabelas)
 *   - U_SXGCriaSX3: cria/atualiza entrada na SX3 (campos)
 *   - U_SXGCriaIdx: cria/atualiza entrada na SIX (índices)
 *
 * O helper é gerado uma única vez por projeto e disponibilizado para
 * download junto da primeira migration.
 *
 * Conteúdo completo implementado na Task F6.3.
 */
export const SXG_HELPERS_PRW = `
#INCLUDE "PROTHEUS.CH"

/*/
{Protheus.doc} U_SXGCriaSX2
@description Cria ou atualiza um registro na SX2 (tabelas do dicionário)
@author SXGerador (gerado automaticamente)
@type function
/*/
User Function SXGCriaSX2(aTabela)
    // TODO (Task F6.3): implementar lógica de inserção/atualização na SX2
    MsgStop("SXGCriaSX2: stub — implemente na Task F6.3", "SXGerador")
Return Nil

/*/
{Protheus.doc} U_SXGCriaSX3
@description Cria ou atualiza um registro na SX3 (campos do dicionário)
@author SXGerador (gerado automaticamente)
@type function
/*/
User Function SXGCriaSX3(aCampo)
    // TODO (Task F6.3): implementar lógica de inserção/atualização na SX3
    MsgStop("SXGCriaSX3: stub — implemente na Task F6.3", "SXGerador")
Return Nil

/*/
{Protheus.doc} U_SXGCriaIdx
@description Cria ou atualiza um registro na SIX (índices do dicionário)
@author SXGerador (gerado automaticamente)
@type function
/*/
User Function SXGCriaIdx(aIndice)
    // TODO (Task F6.3): implementar lógica de inserção/atualização na SIX
    MsgStop("SXGCriaIdx: stub — implemente na Task F6.3", "SXGerador")
Return Nil
`.trimStart();

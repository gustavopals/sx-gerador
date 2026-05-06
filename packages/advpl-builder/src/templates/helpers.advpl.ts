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
    Local cAlias := "SX2"
    Local cChave := aTabela[1]

    dbSelectArea(cAlias)
    dbSetOrder(1)

    If dbSeek(cChave)
        RecLock(cAlias, .F.)
    Else
        RecLock(cAlias, .T.)
        SX2->X2_CHAVE := cChave
    EndIf

    SX2->X2_CHAVE   := aTabela[1]
    SX2->X2_ARQUIVO := aTabela[2]
    SX2->X2_NOME    := aTabela[3]
    SX2->X2_NOMESPA := aTabela[4]
    SX2->X2_NOMEENG := aTabela[5]
    SX2->X2_MODO    := aTabela[6]
    SX2->X2_TTS     := aTabela[7]
    SX2->X2_UNICO   := aTabela[8]

    MsUnLock()
Return Nil

/*/
{Protheus.doc} U_SXGCriaSX3
@description Cria ou atualiza um registro na SX3 (campos do dicionário)
@author SXGerador (gerado automaticamente)
@type function
/*/
User Function SXGCriaSX3(aCampo)
    Local cAlias := "SX3"
    Local cChave := aCampo[1]

    dbSelectArea(cAlias)
    dbSetOrder(2)

    If dbSeek(cChave)
        RecLock(cAlias, .F.)
    Else
        RecLock(cAlias, .T.)
        SX3->X3_CAMPO := cChave
    EndIf

    SX3->X3_CAMPO   := aCampo[1]
    SX3->X3_ORDEM   := aCampo[2]
    SX3->X3_TIPO    := aCampo[3]
    SX3->X3_TAMANHO := aCampo[4]
    SX3->X3_DECIMAL := aCampo[5]
    SX3->X3_TITULO  := aCampo[6]
    SX3->X3_TITSPA  := aCampo[7]
    SX3->X3_TITENG  := aCampo[8]
    SX3->X3_DESCRIC := aCampo[9]
    SX3->X3_DESCSPA := aCampo[10]
    SX3->X3_DESCENG := aCampo[11]
    SX3->X3_PICTURE := aCampo[12]
    SX3->X3_VALID   := aCampo[13]
    SX3->X3_USADO   := aCampo[14]
    SX3->X3_RELACAO := aCampo[15]
    SX3->X3_NIVEL   := aCampo[16]
    SX3->X3_PROPRI  := aCampo[17]
    SX3->X3_BROWSE  := aCampo[18]
    SX3->X3_VISUAL  := aCampo[19]
    SX3->X3_CONTEXT := aCampo[20]

    MsUnLock()
Return Nil

/*/
{Protheus.doc} U_SXGCriaIdx
@description Cria ou atualiza um registro na SIX (índices do dicionário)
@author SXGerador (gerado automaticamente)
@type function
/*/
User Function SXGCriaIdx(aIndice)
    Local cAlias := "SIX"
    Local cOrdem := aIndice[1]

    dbSelectArea(cAlias)
    dbSetOrder(2)

    If dbSeek(cOrdem)
        RecLock(cAlias, .F.)
    Else
        RecLock(cAlias, .T.)
        SIX->ORDEM := cOrdem
    EndIf

    SIX->ORDEM      := aIndice[1]
    SIX->CHAVE      := aIndice[2]
    SIX->DESCRICAO  := aIndice[3]
    SIX->DESCSPA    := aIndice[4]
    SIX->DESCENG    := aIndice[5]
    SIX->PROPRI     := aIndice[6]
    SIX->F3         := aIndice[7]
    SIX->NICKNAME   := aIndice[8]
    SIX->SHOWPESQ   := aIndice[9]
    SIX->IX_VIRTUAL := aIndice[10]
    SIX->IX_VIRCUST := aIndice[11]

    MsUnLock()
Return Nil
`.trimStart();

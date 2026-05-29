# Importação de tabela oficial (PDF — FPF)

## Visão geral

A funcionalidade importa automaticamente tabelas oficiais da **Federação Paulista de Futebol** a partir de PDF, sem cadastro manual de jogos.

**Menu admin:** Competição → **Importar tabela PDF** (`/admin/importacao-tabela`)

**API:** `POST /api/admin/import/schedule-pdf` (multipart/form-data)

## Campos extraídos do PDF

| Campo | Uso no sistema |
|--------|----------------|
| Campeonato | Título do PDF + vínculo ao campeonato selecionado |
| Categoria | Detectada (ex.: Sub-11) ou informada no formulário |
| Fase | `CompetitionPhase` |
| Turno | `CompetitionTurn` |
| Grupo | `Group` (por categoria) |
| Rodada | `CompetitionRound` + `Match.round` |
| Nº do jogo | `Match.matchNumber` |
| Data / horário | `Match.scheduledAt` |
| Mandante / visitante | Clubes + `Team` no grupo |
| Local | `Venue` + `Match.venue` |

## Regras de duplicidade

| Entidade | Critério | Comportamento |
|----------|----------|----------------|
| **Clube** | `normalizedName` (sem acento, sufixos FC/SAF etc.) | Reutiliza ou cria |
| **Grupo** | `categoryId` + nome do grupo | Reutiliza ou cria |
| **Rodada** | campeonato + fase + turno + número | Reutiliza ou cria |
| **Local** | `normalizedName` | Reutiliza ou cria |
| **Jogo** | fingerprint: campeonato, **categoria**, fase, turno, rodada, data/hora, mandante, visitante | Ignora e registra no log |

Índices únicos no banco: `clubs.normalizedName`, `groups(categoryId, name)`, `competition_rounds(...)`, `matches.importFingerprint`, `venues.normalizedName`.

## Fluxo recomendado

1. Cadastre o **campeonato** em Admin → Campeonatos (ou use um existente).
2. Acesse **Importar tabela PDF**.
3. Selecione o campeonato, deixe **“Todas as categorias do PDF”** (Sub-11 + Sub-12 no mesmo arquivo) ou escolha só uma, e envie o PDF.
4. Revise o resumo (criados / reutilizados / duplicados / erros) e o log completo.

## Reimportação

Reenviar o mesmo PDF é **seguro**: clubes, grupos e rodadas existentes são reutilizados; jogos já importados aparecem como *jogo já existente* no log.

A detecção considera o fingerprint atual, o formato antigo (sem categoria no fingerprint) e a mesma partida na categoria (data, mandante, visitante).

## Recomeçar limpo (só dados da importação)

Quando há clubes duplicados (nome da tabela de jogos vs lista de participantes), o fluxo recomendado é:

1. **Reset** dos dados do campeonato (e todos os clubes, se o ambiente for só este campeonato):

```bash
npx tsx scripts/reset-schedule-import-data.ts --list
npx tsx scripts/reset-schedule-import-data.ts <championshipId> --dry-run
npx tsx scripts/reset-schedule-import-data.ts <championshipId> --confirm --all-clubs
```

2. **Importar** o PDF só com participantes (`Sub-11-1-2.pdf`), com **“Só clubes e grupos (sem jogos)”** marcado.

3. Cadastrar jogos manualmente depois (ou importar o PDF completo de jogos quando o vínculo de nomes estiver estável).

`--all-clubs` apaga **todos** os clubes do banco (e atletas/documentos em cascata). Sem essa flag, remove apenas clubes sem time após apagar times do campeonato.

## Limpar duplicatas (administração)

Se jogos foram importados mais de uma vez antes dessa correção:

```bash
npx tsx scripts/audit-import-duplicates.ts
npx tsx scripts/remove-duplicate-import-matches.ts --dry-run
npx tsx scripts/remove-duplicate-import-matches.ts
```

## Formato suportado

Parser `fp-paulista-parser` para layout padrão FPF:

- Lista de clubes participantes
- Linhas `JG RODADA NN` + jogos `001 28/mar - sáb 14 h 30 MANDANTE X VISITANTE Local`
- Marcadores `FASE 01`, `PRIMEIRO TURNO`, `SEGUNDO TURNO`

Outros PDFs oficiais da FPF no mesmo padrão devem funcionar; layouts muito diferentes podem exigir ajuste no parser.

## Arquivos principais

- `services/schedule-import/fp-paulista-parser.ts` — extração de texto
- `services/schedule-import/schedule-import.service.ts` — persistência e deduplicação
- `lib/normalize-name.ts` — normalização de nomes
- `app/api/admin/import/schedule-pdf/route.ts` — API

## Permissões

Apenas `SUPER_ADMIN` e `ADMIN_LIGA`.

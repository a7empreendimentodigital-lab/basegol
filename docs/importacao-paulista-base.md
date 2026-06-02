# Importação — Campeonato Paulista de Base

Fluxo recomendado (sem duplicar cadastros):

### Pacote FPF 2026 (recomendado — um passo)

Arquivos em `basegol_paulista_import_2026/`:

- `basegol_paulista_import_2026.json` (tudo em um arquivo)
- ou `group_teams.csv` + `fixtures.csv` (+ `competitions.csv` opcional)

**Painel:** `/admin/importacao-paulista` — envie o JSON e selecione o campeonato.

**CLI:**

```bash
npm run import:paulista-pack -- ~/Downloads/basegol_paulista_import_2026 <championshipId>
npm run import:paulista-pack -- ~/Downloads/basegol_paulista_import_2026/basegol_paulista_import_2026.json <championshipId> --preview
npm run import:paulista-pack -- ~/Downloads/basegol_paulista_import_2026 <championshipId> --participants-only
```

### Fluxo alternativo (PDF)

1. **Clubes e grupos** — `/admin/importacao-tabela` (PDF) com opção *somente participantes* ou importação completa inicial.
2. **Jogos** — `/admin/importacao-jogos` (PDF) ou `npx tsx scripts/run-schedule-import.ts`.
3. **Atletas** — `/admin/importacao-atletas` (CSV) ou `npx tsx scripts/run-athlete-import.ts`.
4. **Resultados** — `/admin/importacao-resultados` (CSV) ou `npx tsx scripts/run-match-results-import.ts`.
5. **Classificação** — recalculada automaticamente após resultados; manual: `npx tsx scripts/recalculate-standings.ts`.

### Corrigir grupos (lista oficial FPF)

Quando clubes estiverem no grupo errado, use o PDF de participantes ou `group_teams.csv` do pacote:

```bash
npm run sync:group-roster -- ~/Downloads/Sub-11-1-2.pdf
npm run sync:group-roster -- ~/Downloads/basegol_paulista_import_2026 --dry-run
npm run sync:group-roster -- ~/Downloads/basegol_paulista_import_2026 --category Sub-11
```

O script remove inscrições fora da lista, move clubes para o grupo correto e recalcula as tabelas. Sub-11 e Sub-12 usam a mesma distribuição de grupos.

### Jogos a partir dos grupos (recomendado após corrigir grupos)

**Painel:** Admin → Grupos → **Atualizar jogos (FPF)** — sincroniza `group_teams.csv` + importa `fixtures.csv` de `data/fpf-2026/`.

**CLI:**

```bash
npm run sync:group-fixtures
npm run sync:group-fixtures -- --dry-run
npm run sync:group-fixtures -- --category Sub-11
```

Arquivos em `data/fpf-2026/`: `group_teams.csv`, `fixtures.csv`, `competitions.csv` (opcional). Variável `FPF_PACK_DIR` aponta para outra pasta com os mesmos arquivos.

## Variável de ambiente

Todas as importações via script usam **`DATABASE_URL`** (mesma do Prisma / Railway).

## CSV de atletas

Separador: vírgula ou ponto-e-vírgula (detectado automaticamente).

| Coluna | Aliases | Obrigatório |
|--------|---------|-------------|
| clube | club, time | sim |
| nome | first_name | sim* |
| sobrenome | last_name | sim* |
| data_nascimento | birth_date | sim (DD/MM/AAAA ou AAAA-MM-DD) |
| posicao | position | não (padrão: CM) |
| numero | shirt_number | não |
| categoria | category | não (padrão: Sub-11) |

\* Ou `nome_completo` com nome e sobrenome.

**Deduplicação:** mesmo clube + nome normalizado + data de nascimento → atualiza em vez de criar.

Modelo de exemplo: `docs/samples/atletas-exemplo.csv`.

## CSV de resultados

| Coluna | Aliases | Obrigatório |
|--------|---------|-------------|
| jogo | match_number, numero | não* |
| mandante | home, casa | sim |
| visitante | away, fora | sim |
| data | scheduled_at | não* |
| placar_casa | home_score | sim (se status finalizado) |
| placar_fora | away_score | sim |
| pen_casa | home_penalty | não |
| pen_fora | away_penalty | não |
| status | | não (padrão: FINISHED) |
| rodada | round | não |

\* Informe **número do jogo** ou **data** (+ mandante/visitante) para localizar a partida já importada.

**Não cria jogos novos** — apenas atualiza `Match` existente e recalcula `Standing` do grupo.

Modelo: `docs/samples/resultados-exemplo.csv`.

## Scripts CLI

```bash
# Jogos (PDF) — clubes já cadastrados
npx tsx scripts/run-schedule-import.ts tabela.pdf <championshipId>

# Somente participantes (clubes/grupos)
npx tsx scripts/run-schedule-import.ts tabela.pdf <championshipId> --participants-only

# Atletas
npx tsx scripts/run-athlete-import.ts elenco.csv
npx tsx scripts/run-athlete-import.ts elenco.csv --dry-run

# Resultados
npx tsx scripts/run-match-results-import.ts resultados.csv <championshipId> Sub-11
npx tsx scripts/run-match-results-import.ts resultados.csv <championshipId> Sub-12 --dry-run

# Classificação manual
npx tsx scripts/recalculate-standings.ts --championship <championshipId>
npx tsx scripts/recalculate-standings.ts --category <categoryId>
npx tsx scripts/recalculate-standings.ts --group <groupId>
```

## Migração de banco

Nenhuma migração nova é necessária para estas funcionalidades — usa modelos `Athlete`, `Match`, `Standing` já existentes.

## Permissões

Telas e APIs: `SUPER_ADMIN` e `ADMIN_LIGA`.

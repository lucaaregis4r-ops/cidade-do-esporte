[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$errors = [System.Collections.Generic.List[string]]::new()

$requiredFiles = @(
    'PLANO MESTRE DE IMPLEMENTAÇÃO.md',
    'AGENTS.md',
    'README.md',
    'LICENSE',
    'package.json',
    'package-lock.json',
    'docs/00-cimulity-audit.md',
    'docs/00-etapa-0-auditoria.md',
    'docs/PIPELINE.md',
    'docs/CONTEXTO.md',
    'docs/save-format.md',
    'docs/reproducibility.md',
    'game/core/DecisionLog.ts',
    'game/core/DecisionLog.test.ts',
    'game/engine/HeadlessCampaign.ts',
    'game/engine/HeadlessCampaign.test.ts',
    'game/core/campaignSave.ts',
    'game/core/campaignSave.test.ts',
    'game/core/worldStore.persistence.test.ts',
    'game/core/city/cityDistricts.ts',
    'game/core/city/cityDistricts.test.ts',
    'game/core/city/cityParcels.ts',
    'game/core/city/cityParcels.test.ts',
    'game/core/city/cityLandValue.ts',
    'game/core/city/cityLandValue.test.ts',
    'game/core/city/cityGrowth.ts',
    'game/core/city/cityGrowth.test.ts',
    'game/core/city/cityTransformation.ts',
    'game/core/city/cityTransformation.test.ts',
    'game/core/city/citySnapshots.ts',
    'game/core/city/citySnapshots.test.ts',
    'game/engine/CityHistoryPreview.ts',
    'game/engine/CityHistoryPreview.test.ts',
    'game/engine/CityHistoryEnsemble.ts',
    'game/engine/CityHistoryEnsemble.test.ts',
    'app/city-history/page.tsx',
    'app/city-history/viewer.tsx',
    'app/city-history/ensemble/page.tsx',
    'app/city-history/ensemble/viewer.tsx',
    'game/core/economy/HistoricalEconomy.ts',
    'game/core/economy/HistoricalEconomy.test.ts',
    'game/data/history/economic-index.json',
    'docs/research/economy.md',
    'docs/plans/README.md',
    'docs/plans/alpha-a-fundacao-tecnica.md',
    'docs/plans/alpha-b-cidade.md',
    'docs/plans/alpha-c-clube.md',
    'docs/plans/alpha-d-sociedade.md',
    'docs/plans/alpha-e-futebol.md',
    'docs/plans/alpha-f-ecossistema.md',
    'docs/plans/alpha-g-historia.md',
    'docs/plans/alpha-h-1959.md',
    'docs/plans/alpha-i-qualidade.md',
    'docs/upstream/PROVENANCE.md'
)

foreach ($relativePath in $requiredFiles) {
    $fullPath = Join-Path $projectRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        $errors.Add("Arquivo obrigatório ausente: $relativePath")
    }
}

$planPath = Join-Path $projectRoot 'PLANO MESTRE DE IMPLEMENTAÇÃO.md'
$contextPath = Join-Path $projectRoot 'docs/CONTEXTO.md'
$alphaAPath = Join-Path $projectRoot 'docs/plans/alpha-a-fundacao-tecnica.md'
$alphaBPath = Join-Path $projectRoot 'docs/plans/alpha-b-cidade.md'
$cimulityAuditPath = Join-Path $projectRoot 'docs/00-cimulity-audit.md'

if ((Test-Path -LiteralPath $planPath -PathType Leaf) -and (Test-Path -LiteralPath $contextPath -PathType Leaf)) {
    $plan = Get-Content -LiteralPath $planPath -Raw
    $context = Get-Content -LiteralPath $contextPath -Raw

    $stageMatches = [regex]::Matches($plan, '(?m)^# MACROETAPA (\d+)\b')
    $stageNumbers = @($stageMatches | ForEach-Object { [int]$_.Groups[1].Value })
    $expectedStages = @(1..42)

    if ($stageNumbers.Count -ne 42) {
        $errors.Add("Esperadas 42 macroetapas; encontradas $($stageNumbers.Count).")
    }

    if ((Compare-Object -ReferenceObject $expectedStages -DifferenceObject $stageNumbers).Count -gt 0) {
        $errors.Add('A numeração das macroetapas não é exatamente contínua de 1 a 42.')
    }

    if ($plan -notmatch '(?m)^# DEMONSTRAÇÃO VISUAL OBRIGATÓRIA POR MACROETAPA$') {
        $errors.Add('O plano mestre não define o gate de demonstração visual por macroetapa.')
    }
    $visualSectionParts = $plan -split '(?m)^## Mapa das demonstrações\s*$', 2
    $visualSection = if ($visualSectionParts.Count -eq 2) { $visualSectionParts[1] } else { '' }
    $visualStageNumbers = @([regex]::Matches($visualSection, '(?m)^\|\s*(\d+)\s*\|') | ForEach-Object { [int]$_.Groups[1].Value })
    if (($visualStageNumbers -join ',') -ne ($expectedStages -join ',')) {
        $errors.Add('A matriz visual não cobre exatamente as 42 macroetapas em ordem.')
    }

    if ($plan -match '(?m)^# (?:MACRO)?ETAPA 0\b') {
        $errors.Add('O plano agora define uma Etapa 0; revise a convenção registrada na documentação.')
    }

    $actualHash = (Get-FileHash -LiteralPath $planPath -Algorithm SHA256).Hash
    $recordedHashMatch = [regex]::Match($context, 'SHA-256 vigente do plano: `([A-Fa-f0-9]{64})`')
    if (-not $recordedHashMatch.Success) {
        $errors.Add('CONTEXTO.md não registra o SHA-256 vigente do plano.')
    }
    elseif ($recordedHashMatch.Groups[1].Value -ne $actualHash) {
        $errors.Add('O plano mudou sem atualização do hash em CONTEXTO.md.')
    }

    foreach ($stage in $expectedStages) {
        if ($context -notmatch "(?m)^\| $stage \| .+ \| (NÃO INICIADA|EM ANDAMENTO|BLOQUEADA|CONCLUÍDA) \|$") {
            $errors.Add("Status ausente ou inválido para a Macroetapa $stage em CONTEXTO.md.")
        }
    }

    if ($context -notmatch '(?m)^\| 1 \| .+ \| CONCLUÍDA \|$') {
        $errors.Add('A Macroetapa 1 deve estar CONCLUÍDA após o encerramento de A3.')
    }

    if ($context -notmatch '(?m)^\| 2 \| .+ \| CONCLUÍDA \|$') {
        $errors.Add('A Macroetapa 2 deve estar CONCLUÍDA após o encerramento de A5.')
    }

    if ($context -notmatch '(?m)^\| 3 \| .+ \| CONCLUÍDA \|$') {
        $errors.Add('A Macroetapa 3 deve estar CONCLUÍDA após o encerramento de A7.')
    }

    if ($context -notmatch '(?m)^\| 4 \| .+ \| CONCLUÍDA \|$') {
        $errors.Add('A Macroetapa 4 deve estar CONCLUÍDA após a integração de B12 e B13.')
    }
    foreach ($stage in @(5, 6, 7)) {
        if ($context -notmatch "(?m)^\| $stage \| .+ \| EM ANDAMENTO \|$") {
            $errors.Add("A Macroetapa $stage deve permanecer EM ANDAMENTO enquanto seus pacotes Alpha B ainda não foram integrados.")
        }
    }
    if ($context -match '(?m)^\| (?:8|9|[12][0-9]|3[0-6]|38|41) \| .+ \| (?:EM ANDAMENTO|CONCLUÍDA) \|$') {
        $errors.Add('Uma macroetapa posterior ao escopo atual Alpha B foi antecipada.')
    }
    if ($context -notmatch '(?m)^\| 37 \| .+ \| EM ANDAMENTO \|$') {
        $errors.Add('A Macroetapa 37 deve permanecer EM ANDAMENTO até integrar os domínios futuros.')
    }
    if ($context -notmatch '(?m)^\| 39 \| .+ \| EM ANDAMENTO \|$') {
        $errors.Add('A Macroetapa 39 deve permanecer EM ANDAMENTO até a matriz integral de longa duração.')
    }
    if ($context -notmatch '(?m)^\| 40 \| .+ \| EM ANDAMENTO \|$') {
        $errors.Add('A Macroetapa 40 deve permanecer EM ANDAMENTO até concluir as ferramentas DEV.')
    }
}

if (Test-Path -LiteralPath $alphaBPath -PathType Leaf) {
    $alphaB = Get-Content -LiteralPath $alphaBPath -Raw
    if ($alphaB -notmatch '(?m)^Estado: \*\*CONCLUÍDO\*\*\.$') {
        $errors.Add('O pacote Alpha B/B1 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B2 — Terreno, água e relevo procedural\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B2 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B3 — Centro, ferrovia, vias e instituições de 1910\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B3 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B4 — Distritos, população, empregos e centralidade\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B4 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B5 — Parcelas e propriedade\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B5 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B6 — `HistoricalEconomy` em PPU\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B6 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B7 — Valor da terra e overlays\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B7 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B8 — `CityGrowthDirector`\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B8 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B9 — Envelhecimento, demolição e novas centralidades\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B9 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B10 — Snapshots e visor de revisão\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B10 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?s)## B11 — Simulação headless e faixas por seed\s+Estado: \*\*CONCLUÍDO\*\*\.') {
        $errors.Add('O pacote Alpha B/B11 precisa registrar seu estado CONCLUÍDO.')
    }
    if ($alphaB -notmatch '(?m)^Entrega visível exigida pela nova regra do plano mestre: rota `/city-history`') {
        $errors.Add('Alpha B/B10 precisa definir a demonstração visual navegável.')
    }
    if ($alphaB -notmatch '(?m)^Em `npm run dev`, consultar `/city-history/ensemble`') {
        $errors.Add('Alpha B/B11 precisa documentar sua demonstração visual local.')
    }
}

if ((Test-Path -LiteralPath $alphaAPath -PathType Leaf) -and (Test-Path -LiteralPath $cimulityAuditPath -PathType Leaf)) {
    $alphaA = Get-Content -LiteralPath $alphaAPath -Raw
    $cimulityAudit = Get-Content -LiteralPath $cimulityAuditPath -Raw

    if ($alphaA -notmatch '(?m)^\| A2 \| .+ \| A1 \| CONCLUÍDO \|$') {
        $errors.Add('O plano Alpha A não registra A2 como CONCLUÍDO.')
    }

    if ($alphaA -notmatch '(?m)^\| A3 \| .+ \| A2 \| CONCLUÍDO \|$') {
        $errors.Add('O plano Alpha A não registra A3 como CONCLUÍDO.')
    }

    if ($alphaA -notmatch '(?m)^\| A4 \| .+ \| A3 \| CONCLUÍDO \|$') {
        $errors.Add('O plano Alpha A não registra A4 como CONCLUÍDO.')
    }

    if ($alphaA -notmatch '(?m)^\| A5 \| .+ \| A4 \| CONCLUÍDO \|$') {
        $errors.Add('O plano Alpha A não registra A5 como CONCLUÍDO.')
    }

    if ($alphaA -notmatch '(?m)^\| A6 \| .+ \| A4 \| CONCLUÍDO \|$') {
        $errors.Add('O plano Alpha A não registra A6 como CONCLUÍDO.')
    }

    if ($alphaA -notmatch '(?m)^\| A7 \| .+ \| A6 \| CONCLUÍDO \|$') {
        $errors.Add('O plano Alpha A não registra A7 como CONCLUÍDO.')
    }

    if ($cimulityAudit -notmatch '(?m)^Status: \*\*A2 CONCLUÍDO\*\*$') {
        $errors.Add('A auditoria Cimulity não registra o gate A2 concluído.')
    }

    if ($alphaA -notmatch '(?m)^\| A8 \| .+ \| A4, A6, A7 \| CONCLUÍDO \|$') {
        $errors.Add('O plano Alpha A não registra A8 como CONCLUÍDO.')
    }
    if ($alphaA -notmatch '(?m)^\| A9 \| .+ \| A8 \| CONCLUÍDO \|$') {
        $errors.Add('O plano Alpha A não registra A9 como CONCLUÍDO.')
    }
    if ($alphaA -notmatch '(?m)^\| A10 \| .+ \| A9 \| CONCLUÍDO \|$') {
        $errors.Add('O plano Alpha A não registra A10 como CONCLUÍDO.')
    }
}

$architectureTestPath = Join-Path $projectRoot 'game/architecture.test.ts'
if (-not (Test-Path -LiteralPath $architectureTestPath -PathType Leaf)) {
    $errors.Add('O teste de fronteiras arquiteturais da A3 está ausente.')
}
elseif ((Get-Content -LiteralPath $architectureTestPath -Raw) -notmatch 'keeps direct randomness out of production core') {
    $errors.Add('O gate de aleatoriedade direta da A5 está ausente do teste arquitetural.')
}

$campaignRngPath = Join-Path $projectRoot 'game/core/CampaignRng.ts'
$campaignRngTestPath = Join-Path $projectRoot 'game/core/CampaignRng.test.ts'
if (-not (Test-Path -LiteralPath $campaignRngPath -PathType Leaf) -or -not (Test-Path -LiteralPath $campaignRngTestPath -PathType Leaf)) {
    $errors.Add('A implementação ou o teste de CampaignRng da A4 está ausente.')
}

$historicalClockPath = Join-Path $projectRoot 'game/core/HistoricalClock.ts'
$historicalClockTestPath = Join-Path $projectRoot 'game/core/HistoricalClock.test.ts'
if (-not (Test-Path -LiteralPath $historicalClockPath -PathType Leaf) -or -not (Test-Path -LiteralPath $historicalClockTestPath -PathType Leaf)) {
    $errors.Add('A implementação ou o teste de HistoricalClock da A6 está ausente.')
}

$interruptionQueuePath = Join-Path $projectRoot 'game/core/InterruptionQueue.ts'
$interruptionQueueTestPath = Join-Path $projectRoot 'game/core/InterruptionQueue.test.ts'
if (-not (Test-Path -LiteralPath $interruptionQueuePath -PathType Leaf) -or -not (Test-Path -LiteralPath $interruptionQueueTestPath -PathType Leaf)) {
    $errors.Add('A implementação ou o teste de InterruptionQueue da A7 está ausente.')
}

$expectedUpstream = 'https://github.com/zeikar/cimulity.git'
$expectedCommit = '330e59e1fa0f9df6f01e09d327ac57d437a0c466'
$gitDirectory = Join-Path $projectRoot '.git'
if (-not (Test-Path -LiteralPath $gitDirectory)) {
    $errors.Add('Repositório Git ausente após a incorporação A1.')
}
else {
    $upstreamUrl = (& git -C $projectRoot remote get-url upstream 2>$null)
    if ($LASTEXITCODE -ne 0 -or $upstreamUrl.Trim() -ne $expectedUpstream) {
        $errors.Add('Remote upstream ausente ou diferente da URL Cimulity registrada.')
    }

    & git -C $projectRoot cat-file -e "$expectedCommit^{commit}" 2>$null
    if ($LASTEXITCODE -ne 0) {
        $errors.Add('Commit Cimulity fixado não existe no histórico local.')
    }
}

if ($errors.Count -gt 0) {
    Write-Error ("Validação de governança falhou:`n- " + ($errors -join "`n- "))
    exit 1
}

Write-Host 'Validação de governança aprovada: plano, nove Alphas, contexto e proveniência sincronizados.'
exit 0

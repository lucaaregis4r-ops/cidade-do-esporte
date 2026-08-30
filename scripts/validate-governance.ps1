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

    if ($context -notmatch '(?m)^\| 1 \| .+ \| EM ANDAMENTO \|$') {
        $errors.Add('A Macroetapa 1 deve estar EM ANDAMENTO enquanto A2–A10 permanecem pendentes.')
    }

    if ($context -match '(?m)^\| (?:[2-9]|[1-3][0-9]|4[0-2]) \| .+ \| (?:EM ANDAMENTO|CONCLUÍDA) \|$') {
        $errors.Add('Uma macroetapa posterior foi antecipada antes da conclusão da Macroetapa 1.')
    }
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

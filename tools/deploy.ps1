# One-command free deploy to Cloudflare Pages + D1. Needs CLOUDFLARE_API_TOKEN (with Account > D1 > Edit as well as Pages > Edit) and CLOUDFLARE_ACCOUNT_ID.
# Free tier only. Run from the proof-forge folder: powershell -File tools/deploy.ps1
$ErrorActionPreference = "Stop"
$w = "C:\ct\tools\wrangler3\node_modules\.bin\wrangler.cmd"
if (-not (Test-Path $w)) { throw "wrangler 3 not found at $w" }
node tools/build-dist.cjs audit-public-key.json
$out = & $w d1 create proof-forge 2>&1 | Out-String
if ($out -notmatch 'database_id\s*=\s*"([0-9a-f-]{36})"') { $out = & $w d1 list --json 2>&1 | Out-String; $m = [regex]::Match($out, '"uuid":\s*"([0-9a-f-]{36})"[^}]*"name":\s*"proof-forge"|"name":\s*"proof-forge"[^}]*"uuid":\s*"([0-9a-f-]{36})"'); if (-not $m.Success) { throw "could not read the D1 id:`n$out" }; $id = if ($m.Groups[1].Value) { $m.Groups[1].Value } else { $m.Groups[2].Value } } else { $id = $Matches[1] }
& $w d1 execute proof-forge --remote --file migrations/0001_init.sql
@"
name = "proof-forge"
compatibility_date = "2024-09-01"
pages_build_output_dir = "dist"
[[d1_databases]]
binding = "DB"
database_name = "proof-forge"
database_id = "$id"
"@ | Set-Content wrangler.toml -Encoding utf8
try { & $w pages project create proof-forge --production-branch main } catch { Write-Host "project exists" }
& $w pages deploy dist --project-name proof-forge --branch main
Write-Host "Live at https://proof-forge.pages.dev"

param([int]$Limit = 500, [int]$MaxPages = 20, [switch]$DryRun)

$ErrorActionPreference = 'Stop'
$tok    = $env:SUPABASE_ACCESS_TOKEN            # sbp_... (CREDENCIAIS.md, nunca no repo)
$srcRef = 'esfpllxkvyakjtxvlvco'                          # banco da Eterniza (leitura)
$hubUrl = 'https://project-hub-folha-midia.vercel.app/api/v1/orders-sync'
$secret = $env:ORDERS_SYNC_SECRET                # igual ao da Vercel do Hub
$projId = '801f9e07-b2fa-49d0-a40c-012ee4cd6eb1'
$h = @{ Authorization = "Bearer $tok"; 'Content-Type' = 'application/json' }

# Mapeamento identico ao mapOrderToSale() de eterniza-landing/api/_hub_sync.js.
# Extrai os campos direto no SQL para NAO trafegar os JSONB inteiros (cakto_payload
# carrega gen.videoUrl e cia; puxar 6k deles inteiros seria varredura pesada).
function Get-Page($afterIso, $lim) {
  $sql = @"
select
  coalesce(nullif(gateway_order_id::text,''),'order-'||id::text)               as transaction_id,
  case status when 'recuperacao_pix' then 'pending' else 'paid' end            as status,
  status                                                                       as event,
  coalesce(valor,0)                                                            as amount,
  coalesce(nullif(cakto_payload->>'product_name',''), nullif(typebot_payload->>'_oferta',''),
           nullif(cakto_payload#>>'{gen,offer}',''),
           'Homenagem Eterniza')                                               as product_name,
  customer_name, customer_email, customer_phone,
  coalesce(nullif(cakto_payload->>'paymentMethod',''), nullif(cakto_payload->>'payment_method',''),
           nullif(cakto_payload->>'method',''),
           case when status='recuperacao_pix' then 'pix' end)                  as payment_method,
  -- O funil passou a gravar as UTMs num objeto "utms" dentro do cakto_payload; o
  -- mapeamento de 13/07 lia so os campos soltos e por isso perdia 93% da atribuicao.
  coalesce(nullif(cakto_payload#>>'{utms,utm_source}',''),   nullif(typebot_payload->>'utm_source',''),   nullif(cakto_payload->>'utm_source',''))   as utm_source,
  coalesce(nullif(cakto_payload#>>'{utms,utm_medium}',''),   nullif(typebot_payload->>'utm_medium',''),   nullif(cakto_payload->>'utm_medium',''))   as utm_medium,
  coalesce(nullif(cakto_payload#>>'{utms,utm_campaign}',''), nullif(typebot_payload->>'utm_campaign',''), nullif(cakto_payload->>'utm_campaign','')) as utm_campaign,
  coalesce(nullif(cakto_payload#>>'{utms,utm_content}',''),  nullif(typebot_payload->>'utm_content',''),  nullif(cakto_payload->>'utm_content',''))  as utm_content,
  coalesce(nullif(cakto_payload#>>'{utms,utm_term}',''),     nullif(typebot_payload->>'utm_term',''),     nullif(cakto_payload->>'utm_term',''))     as utm_term,
  cakto_payload#>>'{gen,offer}'                                                as src,
  case when status <> 'recuperacao_pix' then
    coalesce(nullif(cakto_payload->>'paidAt',''), nullif(cakto_payload->>'paid_at',''),
             nullif(cakto_payload->>'approvedAt',''), nullif(cakto_payload->>'approved_at',''),
             created_at::text)
  end                                                                          as paid_at,
  created_at                                                                   as ordered_at,
  created_at                                                                   as _cursor
from public.orders
where status in ('recuperacao_pix','pago','fila_edicao','produzindo','pronta','entregue')
  and created_at > '$afterIso'::timestamptz
order by created_at asc
limit $lim
"@
  $body = @{ query = $sql } | ConvertTo-Json -Depth 3
  return Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$srcRef/database/query" -Method Post -Headers $h -Body $body -TimeoutSec 120
}

$after = '1970-01-01T00:00:00Z'
$total = 0; $enviados = 0; $pagina = 0

while ($pagina -lt $MaxPages) {
  $pagina++
  $rows = @(Get-Page $after $Limit)
  # Invoke-RestMethod as vezes entrega o array de linhas embrulhado num unico item
  while ($rows.Count -eq 1 -and $rows[0] -is [System.Array]) { $rows = @($rows[0]) }
  if ($rows.Count -eq 0) { Write-Host "pagina $pagina : vazia — fim"; break }

  $last  = $rows | Select-Object -Last 1
  $after = ([datetime]([string]$last._cursor)).ToUniversalTime().ToString('o')
  $total += $rows.Count

  $orders = $rows | Select-Object transaction_id, status, event, amount, product_name,
    customer_name, customer_email, customer_phone, payment_method,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, paid_at, ordered_at

  if ($DryRun) {
    Write-Host ("pagina {0}: {1} pedidos (DRY RUN). exemplo: {2}" -f $pagina, $rows.Count, ($orders[0] | ConvertTo-Json -Compress))
    break
  }

  $payload = @{ gateway = 'eterniza'; project_id = $projId; orders = $orders } | ConvertTo-Json -Depth 5
  try {
    $hdr = @{
      'x-sync-secret'             = $secret
      'x-vercel-protection-bypass' = $env:VERCEL_BYPASS_SECRET  # Deployment Protection segue LIGADA
      'Content-Type'              = 'application/json'
    }
    $resp = Invoke-RestMethod -Uri $hubUrl -Method Post -Headers $hdr -Body $payload -TimeoutSec 180
    $enviados += $resp.upserted
    Write-Host ("pagina {0}: lidos {1} | upserted {2} | acumulado {3} | cursor {4}" -f $pagina, $rows.Count, $resp.upserted, $enviados, $after)
  } catch {
    Write-Host ("pagina {0}: FALHOU -> {1}" -f $pagina, $_.ErrorDetails.Message)
    break
  }

  if ($rows.Count -lt $Limit) { Write-Host "ultima pagina (parcial)"; break }
  Start-Sleep -Milliseconds 400
}

Write-Host ""
Write-Host ("LIDOS {0} | ESPELHADOS {1}" -f $total, $enviados)

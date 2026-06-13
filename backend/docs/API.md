# Referência da API

Base: `/api/v1` · Auth: `Authorization: Bearer <token>` (exceto `/auth/login`).
Todos os endpoints respondem `501 NOT_IMPLEMENTED` até serem ligados.

## Auth
| Método | Rota | Corpo / Query | Retorno |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/logout` | — | `204` |
| GET | `/auth/me` | — | `{ user }` |

## Usuários (perfil)
| Método | Rota | Corpo / Query | Retorno |
|---|---|---|---|
| GET | `/users` | — | `User[]` |
| POST | `/users` | `{ name, email, password, role? }` | `User` |
| GET | `/users/:id` | — | `User` |
| PATCH | `/users/:id` | `{ name?, photoUrl?, password? }` | `User` |
| GET | `/users/:id/calendar` | `?from&to` | calendário pessoal (tarefas+ações+reuniões) |

## Home / Projetos
| Método | Rota | Corpo / Query | Retorno |
|---|---|---|---|
| GET | `/projects/dashboard` | — | `{ faturamentoTotal, projetosAtivos, destaque }` |
| GET | `/projects` | `?active` | `Project[]` (cards) |
| POST | `/projects` | dados do projeto + oferta + persona (só `name` obrigatório) | `Project` |
| GET | `/projects/:id` | — | `Project` (com oferta, persona, links, criativos) |
| GET | `/projects/:id/overview` | — | KPIs: faturamento, lucro, gasto, tempo no ar, top3 criativos |
| PATCH | `/projects/:id` | `{ name?, niche?, active? }` | `Project` |
| DELETE | `/projects/:id` | — | `204` (soft delete: `active=false`) |

## Gestão de oferta (sob `/projects/:id`)
| Método | Rota | Corpo |
|---|---|---|
| GET / PUT | `/offer` | `{ description?, audience?, ageRange?, mainChannel? }` |
| GET / POST | `/links` · DELETE `/links/:linkId` | `{ type, url }` |
| GET / PUT | `/persona` | `{ who?, pain?, desire?, objection?, channel? }` |
| GET / POST / PATCH / DELETE | `/creatives[/:creativeId]` | `{ name, sales?, spend?, revenue? }` |
| GET / POST / PATCH / DELETE | `/actions[/:actionId]` | `{ date, label, responsibleId? }` |

## Métricas (linha do tempo / gráfico)
| Método | Rota | Corpo / Query |
|---|---|---|
| GET | `/projects/:id/metrics` | `?from&to&source` → `MetricSnapshot[]` (com delta diário) |
| POST | `/projects/:id/metrics` | `{ date, revenue, netProfit, adSpend, source? }` |

## Tarefas
| Método | Rota | Corpo / Query |
|---|---|---|
| GET | `/tasks` | `?projectId&assigneeId&done` |
| POST | `/tasks` | `{ title, projectId?, assigneeId?, dueDate? }` |
| PATCH | `/tasks/:id` | `{ title?, assigneeId?, dueDate?, done? }` |
| DELETE | `/tasks/:id` | — |

## Reuniões
| Método | Rota | Corpo |
|---|---|---|
| GET | `/meetings` | `?from&to` |
| POST | `/meetings` | `{ title, date, time?, participantIds[] }` |
| PATCH / DELETE | `/meetings/:id` | — |

## Calendário geral
| Método | Rota | Query |
|---|---|---|
| GET | `/calendar` | `?userId&from&to` (sem `userId` = todos; com = calendário da pessoa) |

## Rastreamento
| Método | Rota | Query |
|---|---|---|
| GET | `/audit` | `?projectId&userId&entityType&cursor&limit` → `AuditLog[]` |

## Integrações
| Método | Rota | Corpo |
|---|---|---|
| GET | `/projects/:id/integrations` | — |
| POST | `/projects/:id/integrations` | `{ provider, externalAccountId, credentialRef }` |
| DELETE | `/projects/:id/integrations/:provider` | — |
| POST | `/projects/:id/integrations/:provider/sync` | — (puxa métricas → snapshots) |
| POST | `/webhooks/utmfy` | payload da UTMFy |
| POST | `/webhooks/cakto` | payload da Cakto |

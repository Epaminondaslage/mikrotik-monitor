# Mikrotik Monitor

Dashboard de monitoramento dedicado ao **Mikrotik RB2011UiAS-2HnD** (10.0.0.1).  
Deploy em container Docker no servidor `www` (10.0.0.5, Ubuntu ARM64).

---

## Stack

| Camada    | Tecnologia                        |
|-----------|-----------------------------------|
| Backend   | Node.js 20 + Express + net-snmp   |
| Frontend  | React 18 + Vite + Tailwind CSS    |
| Banco     | SQLite (better-sqlite3)           |
| Container | Docker + Docker Compose           |
| Proxy     | Nginx Alpine                      |

---

## Funcionalidades

- **Cards de sistema**: CPU%, Memória%, Temperatura (°C), Voltagem (V), Uptime
- **Tabela de interfaces**: 15 interfaces com badge UP/DOWN e tráfego atual em Mbps
- **Gráficos MRTG**: tráfego IN/OUT por interface — ranges 24h, 7d, 30d
- **Coleta SNMP v2c** a cada 5 minutos, dados persistidos por 30 dias
- **Dark/Light mode** com toggle (padrão: dark)
- Interface pública sem autenticação (uso interno)

---

## Estrutura

```
mikrotik-monitor/
├── backend/
│   ├── src/
│   │   ├── server.js           # Entrada Express
│   │   ├── models/db.js        # SQLite + schema
│   │   ├── services/collector.js  # Coletor SNMP periódico
│   │   └── routes/
│   │       ├── metrics.js      # GET /api/metrics/latest|history
│   │       ├── interfaces.js   # GET /api/interfaces
│   │       └── traffic.js      # GET /api/traffic/:id|summary
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── layout/Layout.jsx
│   │   │   ├── cards/MetricCards.jsx
│   │   │   ├── cards/InterfacesTable.jsx
│   │   │   └── charts/TrafficChart.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── InterfacesPage.jsx
│   │   │   └── TrafficPage.jsx
│   │   ├── hooks/useApi.js
│   │   └── utils/api.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── scripts/
│   └── mikrotik-monitor.sh     # Gerenciamento
├── data/                       # Volume SQLite (criado no deploy)
└── docker-compose.yml
```

---

## Iniciar

```bash
mikrotik-monitor start
```

Acesso: **http://10.0.0.5:3040**

---

## OIDs SNMP coletados

| Métrica         | OID                                        |
|-----------------|--------------------------------------------|
| CPU %           | .1.3.6.1.2.1.25.3.3.1.2.1                 |
| Memória total   | .1.3.6.1.2.1.25.2.2.0                     |
| Memória usada   | .1.3.6.1.2.1.25.2.3.1.6.1                 |
| Uptime          | .1.3.6.1.2.1.1.3.0                        |
| Temperatura     | .1.3.6.1.4.1.14988.1.1.3.100.1.3.14 (÷10)|
| Voltagem        | .1.3.6.1.4.1.14988.1.1.3.100.1.3.13 (÷10)|
| IF In Octets    | .1.3.6.1.2.1.2.2.1.10.{index}             |
| IF Out Octets   | .1.3.6.1.2.1.2.2.1.16.{index}             |
| IF Status       | .1.3.6.1.2.1.2.2.1.8.{index}              |

---

## Mapeamento de interfaces

| Index | Nome             | Tipo     |
|-------|------------------|----------|
| 1     | sfp1             | sfp      |
| 2–11  | ether1–ether10   | ethernet |
| 12    | WI-FI            | wifi     |
| 13    | bridge-interna   | bridge   |
| 14    | pppoe-provedor   | pppoe    |
| 15    | l2tp-Planetfone  | l2tp     |

---

## API REST

```
GET /api/health
GET /api/metrics/latest
GET /api/metrics/history?range=24h|7d|30d
GET /api/interfaces
GET /api/traffic/summary?range=24h|7d|30d
GET /api/traffic/:ifaceIndex?range=24h|7d|30d
```

---

## Comandos úteis

```bash
mikrotik-monitor start          # Inicia
mikrotik-monitor stop           # Para
mikrotik-monitor restart        # Rebuild + restart
mikrotik-monitor logs           # Todos os logs
mikrotik-monitor logs-backend   # Logs do coletor SNMP
mikrotik-monitor status         # Status + healthcheck
mikrotik-monitor update         # git pull + rebuild
mikrotik-monitor prune-db       # Remove dados > 30 dias
```

---

Sítio Pé de Serra · 10.0.0.5

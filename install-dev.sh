#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"; cd "$SCRIPT_DIR"
API_PORT_LOCAL="${BUDGETMAP_API_PORT:-2311}"
WEB_PORT_LOCAL="${BUDGETMAP_WEB_PORT:-2310}"
LAN_IP="${BUDGETMAP_LAN_IP:-$(
  detected_ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"
  if [ -z "$detected_ip" ]; then
    detected_ip="$(hostname -I 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i ~ /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./){print $i; exit}}')"
  fi
  printf '%s' "$detected_ip"
)}"
WEB_HOST="${BUDGETMAP_WEB_HOST:-0.0.0.0}"
API_HOST="${BUDGETMAP_API_HOST:-0.0.0.0}"
fail(){ printf 'Lỗi: %s\n' "$1" >&2; exit 1; }
[ -n "$LAN_IP" ] || fail 'Không xác định được IP LAN. Chạy lại với BUDGETMAP_LAN_IP=192.168.x.x.'
require_command(){ command -v "$1" >/dev/null 2>&1 || fail "Thiếu command bắt buộc: $1"; }
require_command node; require_command npm; require_command docker; require_command curl
docker compose version >/dev/null 2>&1 || fail 'Docker Compose plugin không khả dụng.'
docker info >/dev/null 2>&1 || fail 'Docker daemon không hoạt động hoặc user chưa có quyền Docker.'
node_major="$(node -p 'process.versions.node.split(".")[0]')"; [ "$node_major" = 22 ] || fail "BudgetMap yêu cầu Node.js 22, hiện tại là $(node -v)."
[ -d node_modules ] || printf 'Cảnh báo: chưa có node_modules; npm ci sẽ cài dependencies.\n'
[ -f .env ] || fail 'Thiếu .env. Tạo từ .env.example trước khi chạy script.'
if command -v ss >/dev/null 2>&1 && ss -ltn "( sport = :$WEB_PORT_LOCAL or sport = :$API_PORT_LOCAL )" | tail -n +2 | grep -q .; then fail "Port $WEB_PORT_LOCAL hoặc $API_PORT_LOCAL đang bị chiếm; hãy giải phóng port hoặc đặt BUDGETMAP_WEB_PORT/BUDGETMAP_API_PORT rồi chạy lại."; fi
docker compose config >/dev/null || fail 'docker compose config thất bại.'
if ! docker compose ps --status running postgres 2>/dev/null | grep -q postgres; then docker compose up -d postgres; fi
for attempt in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U budgetmap -d budgetmap >/dev/null 2>&1; then break; fi
  [ "$attempt" -lt 30 ] || fail 'PostgreSQL không accepting connections sau 60 giây.'; sleep 2
done
set -a; . "$SCRIPT_DIR/.env"; set +a
npm ci --no-audit --no-fund
npm run db:validate; npm run db:generate; npm run db:migrate; npm run db:seed
if ! docker compose exec -T postgres psql -U budgetmap -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='budgetmap_test'" | grep -q 1; then docker compose exec -T postgres createdb -U budgetmap budgetmap_test; fi
DATABASE_URL='postgresql://budgetmap:budgetmap@127.0.0.1:5434/budgetmap_test?schema=public' npm run db:test:migrate
api_pid=''; web_pid=''
cleanup(){ trap - EXIT INT TERM; [ -z "$web_pid" ] || kill "$web_pid" 2>/dev/null || true; [ -z "$api_pid" ] || kill "$api_pid" 2>/dev/null || true; wait "$web_pid" 2>/dev/null || true; wait "$api_pid" 2>/dev/null || true; printf '\nBudgetMap API/Web đã dừng; PostgreSQL vẫn được giữ nguyên.\n'; }
trap cleanup EXIT INT TERM
run_prefixed(){ prefix="$1"; shift; "$@" 2>&1 | sed -u "s/^/[$prefix] /"; }
API_HOST="$API_HOST" API_PORT="$API_PORT_LOCAL" CORS_ORIGIN="http://127.0.0.1:$WEB_PORT_LOCAL,http://localhost:$WEB_PORT_LOCAL,http://$LAN_IP:$WEB_PORT_LOCAL" run_prefixed api npm run dev --workspace=@budgetmap/api & api_pid=$!
health_ok=false; last_health='không nhận được phản hồi'
for attempt in $(seq 1 30); do
  status="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 5 "http://127.0.0.1:$API_PORT_LOCAL/health" || true)"
  [ "$status" = 200 ] && health_ok=true && break
  kill -0 "$api_pid" 2>/dev/null || fail "API đã dừng khi khởi động; health trả $status."
  [ "$status" = 503 ] && last_health='database chưa sẵn sàng (HTTP 503)' || last_health="health chưa sẵn sàng (HTTP $status)"; sleep 2
done
[ "$health_ok" = true ] || fail "API health check thất bại sau 60 giây: $last_health. Kiểm tra DATABASE_URL và PostgreSQL."
NEXT_PUBLIC_API_URL="http://$LAN_IP:$API_PORT_LOCAL/api" BUDGETMAP_API_PROXY_TARGET="http://$LAN_IP:$API_PORT_LOCAL" run_prefixed web npm run dev --workspace=@budgetmap/web -- --hostname "$WEB_HOST" --port "$WEB_PORT_LOCAL" & web_pid=$!
web_ok=false
for attempt in $(seq 1 30); do
  status="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 5 "http://127.0.0.1:$WEB_PORT_LOCAL/login" || true)"
  [[ "$status" =~ ^(2|3) ]] && web_ok=true && break
  kill -0 "$web_pid" 2>/dev/null || fail "Web đã dừng khi khởi động; /login trả $status."; sleep 2
done
[ "$web_ok" = true ] || fail "Web không phản hồi tại http://127.0.0.1:$WEB_PORT_LOCAL/login sau 60 giây."
lan_web_ok=false
lan_status="không nhận được phản hồi"
for attempt in $(seq 1 10); do
  lan_status="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 5 "http://$LAN_IP:$WEB_PORT_LOCAL/login" || true)"
  [[ "$lan_status" =~ ^(2|3) ]] && lan_web_ok=true && break
  sleep 1
done
[ "$lan_web_ok" = true ] || printf 'Cảnh báo: chưa tự kiểm tra được Web qua LAN (%s). Nếu điện thoại không vào được, hãy mở firewall TCP port %s.\n' "$lan_status" "$WEB_PORT_LOCAL" >&2
cat <<EOF

BudgetMap development is running
- Web local: http://127.0.0.1:$WEB_PORT_LOCAL/login
- API health local: http://127.0.0.1:$API_PORT_LOCAL/health
- Điện thoại cùng Wi-Fi/LAN: http://$LAN_IP:$WEB_PORT_LOCAL/login
- API health LAN: http://$LAN_IP:$API_PORT_LOCAL/health
- Dashboard: http://127.0.0.1:$WEB_PORT_LOCAL/dashboard
- Transactions: http://127.0.0.1:$WEB_PORT_LOCAL/transactions
- Monthly Plan: http://127.0.0.1:$WEB_PORT_LOCAL/plans/YYYY/MM

Nếu điện thoại không truy cập được: cho phép TCP port $WEB_PORT_LOCAL qua firewall và đảm bảo máy tính/điện thoại cùng mạng.

Ctrl+C sẽ dừng API/Web do script khởi động; PostgreSQL và volume không bị dừng hoặc xóa.
EOF
wait -n "$api_pid" "$web_pid"

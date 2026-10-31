#!/usr/bin/env bash
# Dos mozos cambian la MISMA mesa al mismo tiempo a destinos distintos.
# Esperado: uno gana, el otro recibe "no está ocupada"; la cuenta queda entera en un solo destino.
set -euo pipefail
P="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-5433} -U ${PGUSER:-postgres} -qtA -v ON_ERROR_STOP=1"

read -r T A B C P1 < <($P -F' ' -c "
WITH t AS (INSERT INTO tenants VALUES (gen_random_uuid()) RETURNING id),
a AS (INSERT INTO mesas (tenant_id, numero, estado) SELECT id, 1, 'ocupada' FROM t RETURNING id, tenant_id),
b AS (INSERT INTO mesas (tenant_id, numero, estado) SELECT id, 2, 'libre' FROM t RETURNING id),
c AS (INSERT INTO mesas (tenant_id, numero, estado) SELECT id, 3, 'libre' FROM t RETURNING id),
p AS (INSERT INTO pedidos (tenant_id, mesa_id, total, created_at) SELECT tenant_id, id, 1000, now() - interval '5 minutes' FROM a RETURNING id)
SELECT (SELECT id FROM t), (SELECT id FROM a), (SELECT id FROM b), (SELECT id FROM c), (SELECT id FROM p);")

# Mozo 1: cambia A→B y retiene el lock 2 s antes de confirmar.
( $P -c "BEGIN; SELECT cambiar_mesa('$T','$A','$B'); SELECT pg_sleep(2); COMMIT;" > /tmp/mozo1.out 2>&1; echo "exit=$?" >> /tmp/mozo1.out ) &
sleep 0.5
# Mozo 2: intenta A→C mientras tanto (debe esperar el lock y luego fallar).
set +e
OUT2=$($P -c "SELECT cambiar_mesa('$T','$A','$C');" 2>&1); EXIT2=$?
set -e
wait

echo "mozo1: $(tr '\n' ' ' < /tmp/mozo1.out)"
echo "mozo2: exit=$EXIT2 $OUT2"

EN_B=$($P -c "SELECT count(*) FROM pedidos WHERE id='$P1' AND mesa_id='$B'")
EST=$($P -c "SELECT string_agg(numero||':'||estado, ',' ORDER BY numero) FROM mesas WHERE tenant_id='$T'")
echo "pedido en B: $EN_B | estados: $EST"

[[ $EXIT2 -ne 0 && "$OUT2" == *"no está ocupada"* ]] || { echo "FALLO: el mozo 2 debía ser rechazado"; exit 1; }
[[ "$EN_B" == "1" ]] || { echo "FALLO: el pedido debía quedar en B"; exit 1; }
[[ "$EST" == "1:libre,2:ocupada,3:libre" ]] || { echo "FALLO: estados inesperados"; exit 1; }

# Cruce A↔B simultáneo (deadlock): A ocupada→B libre y B... (B libre no puede origen) → usamos dos mesas ocupadas
# cambiando cada una a la libre de la otra pareja con locks en orden estable: no debe haber deadlock.
read -r T2 M1 M2 L1 < <($P -F' ' -c "
WITH t AS (INSERT INTO tenants VALUES (gen_random_uuid()) RETURNING id),
m1 AS (INSERT INTO mesas (tenant_id, numero, estado) SELECT id, 1, 'ocupada' FROM t RETURNING id),
m2 AS (INSERT INTO mesas (tenant_id, numero, estado) SELECT id, 2, 'ocupada' FROM t RETURNING id),
l1 AS (INSERT INTO mesas (tenant_id, numero, estado) SELECT id, 3, 'libre' FROM t RETURNING id)
SELECT (SELECT id FROM t), (SELECT id FROM m1), (SELECT id FROM m2), (SELECT id FROM l1);")
( $P -c "BEGIN; SELECT cambiar_mesa('$T2','$M1','$L1'); SELECT pg_sleep(1); COMMIT;" > /tmp/x1.out 2>&1; echo "exit=$?" >> /tmp/x1.out ) &
sleep 0.3
set +e
OUTX=$($P -c "SELECT cambiar_mesa('$T2','$M2','$L1');" 2>&1); EXITX=$?
set -e
wait
[[ $EXITX -ne 0 && "$OUTX" == *"no está libre"* ]] || { echo "FALLO: dos mesas a la misma libre: el segundo debía ser rechazado ($OUTX)"; exit 1; }
grep -q "exit=0" /tmp/x1.out || { echo "FALLO: el primero debía ganar"; cat /tmp/x1.out; exit 1; }

echo "OK concurrencia: misma mesa a dos destinos y dos mesas a un mismo destino se serializan sin estados cruzados"

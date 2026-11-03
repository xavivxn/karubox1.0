# Publicar un aviso en la campanita

Los avisos aparecen en la campanita de la barra superior del POS para el admin y los
cajeros de cada local. El número rojo se ve hasta que cada usuario abre la campanita
(el tilde de "Visto" se guarda por usuario). A los 10 días el aviso se borra solo.

Se cargan desde el SQL editor de Supabase (o con service_role); desde la app nadie puede publicar.

## Para todos los locales

```sql
insert into public.avisos (titulo, cuerpo)
values (
  'Título corto',
  E'Primer párrafo.\n\nSegundo párrafo.'
);
```

## Para un solo local

```sql
insert into public.avisos (titulo, cuerpo, tenant_id)
values ('Título', 'Texto', (select id from public.tenants where slug = 'slug-del-local'));
```

## Otras cosas útiles

- Programarlo para más tarde: agregá `publicado_at` con la fecha y hora.
- Que dure más o menos que 10 días: agregá `expira_at` (ej. `now() + interval '3 days'`).
- Sacarlo antes de tiempo: `delete from public.avisos where id = '...';`
- Quiénes lo vieron:
  ```sql
  select u.nombre, t.nombre as local, v.visto_at
  from public.avisos_vistos v
  join public.usuarios u on u.id = v.usuario_id
  join public.tenants t on t.id = u.tenant_id
  where v.aviso_id = '...';
  ```

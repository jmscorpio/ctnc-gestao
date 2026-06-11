-- ============================================================
-- CTNC Gestão — Migration 007: Seed de Categorias Padrão
-- ============================================================

-- Função para criar categorias padrão de um tenant
create or replace function criar_categorias_padrao(p_tenant_id uuid)
returns void language plpgsql as $$
begin
  insert into categorias_financeiras (tenant_id, tipo, nome, cor) values
    (p_tenant_id, 'receita', 'Convênios',         '#10b981'),
    (p_tenant_id, 'receita', 'Doações',            '#3b82f6'),
    (p_tenant_id, 'receita', 'Cotas mensais',      '#8b5cf6'),
    (p_tenant_id, 'receita', 'Eventos',            '#f59e0b'),
    (p_tenant_id, 'despesa', 'Alimentação',        '#f97316'),
    (p_tenant_id, 'despesa', 'Medicamentos',       '#ef4444'),
    (p_tenant_id, 'despesa', 'Pessoal',            '#8b5cf6'),
    (p_tenant_id, 'despesa', 'Utilidades',         '#06b6d4'),
    (p_tenant_id, 'despesa', 'Manutenção',         '#f59e0b'),
    (p_tenant_id, 'despesa', 'Administrativo',     '#6b7280');
end;
$$;

-- Trigger: cria categorias padrão automaticamente para novos tenants
create or replace function trg_novo_tenant_categorias()
returns trigger language plpgsql as $$
begin
  perform criar_categorias_padrao(NEW.id);
  return NEW;
end;
$$;

create trigger trg_tenant_insert_categorias
  after insert on tenants
  for each row execute function trg_novo_tenant_categorias();

-- Seed para tenants existentes que ainda não têm categorias
do $$
declare
  r record;
begin
  for r in
    select t.id from tenants t
    where not exists (
      select 1 from categorias_financeiras c where c.tenant_id = t.id
    )
  loop
    perform criar_categorias_padrao(r.id);
  end loop;
end;
$$;

-- 0006_billing_items_policies.sql
-- Mesma regra por enquanto: qualquer membro ativo da organização lê/escreve.
-- Quando a visão financeira limitada do gestor de projeto for desenhada
-- (decisão registrada: gestor vê financeiro do próprio cliente), esta
-- política é refinada.

create policy "billing_items_all_org_member"
  on public.billing_items
  for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

import { useState, useEffect } from 'react';
import { getUserOrganizations } from '@services/db/index.js';

export default function DashboardPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    const result = await getUserOrganizations();
    if (result.data) {
      setOrganizations(result.data);
    }
    setLoading(false);
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h1 mb-4">Bem-vindo!</h2>
        <p className="text-text-secondary">
          Sistema de gestão para agência ON Digital.
        </p>
      </div>

      {organizations.length > 0 && (
        <div>
          <h3 className="text-h2 mb-4">Suas organizações</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <div key={org.id} className="card-hover">
                <h4 className="font-semibold text-text-primary">{org.name}</h4>
                <p className="text-sm text-text-secondary mt-2">{org.slug}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {organizations.length === 0 && (
        <div className="card text-center p-8">
          <p className="text-text-secondary mb-4">Nenhuma organização encontrada</p>
        </div>
      )}
    </div>
  );
}

/**
 * Componente Logo que exibe o wordmark oficial completo da ON Digital
 * ("on digital" na tipografia real da marca + ícone do foguete),
 * extraído da arte-final em PDF.
 */

export default function Logo({ height = 40 }: { height?: number }) {
  return (
    <div className="flex justify-center">
      <img
        src="/logo-lockup-purple.png"
        alt="ON Digital"
        style={{ height, width: 'auto' }}
      />
    </div>
  );
}

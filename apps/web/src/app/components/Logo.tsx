/**
 * Componente Logo que exibe o ícone oficial da ON Digital
 * (foguete roxo dentro do círculo, extraído da arte-final da marca).
 */

export default function Logo({ size = 48 }: { size?: number }) {
  return (
    <div className="flex justify-center">
      <img
        src="/logo-icon.png"
        alt="ON Digital"
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    </div>
  );
}

/**
 * Componente Logo que exibe o ícone roxo da ON Digital.
 * O ícone é renderizado como SVG inline.
 */

export default function Logo() {
  return (
    <div className="flex justify-center">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Foguete roxo (simplificado para SVG) */}
        <circle cx="24" cy="24" r="22" fill="#5F368B" />
        <path
          d="M24 10L30 20H26V32C26 34.2 24.2 36 22 36C19.8 36 18 34.2 18 32V20H14L24 10Z"
          fill="white"
        />
        <circle cx="20" cy="24" r="2" fill="#8C63B3" />
        <circle cx="28" cy="24" r="2" fill="#8C63B3" />
        <path d="M16 32L14 38M32 32L34 38" stroke="white" strokeWidth="2" />
      </svg>
    </div>
  );
}

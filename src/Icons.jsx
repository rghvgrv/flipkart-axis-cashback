// Inline SVGs so there is no icon dependency to install or tree-shake.
const svg = (props, children) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const Calendar = (p) =>
  svg(p, (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ));

export const Receipt = (p) =>
  svg(p, (
    <>
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ));

export const Target = (p) =>
  svg(p, (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ));

export const Wallet = (p) =>
  svg(p, (
    <>
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <path d="M3 10h18M16.5 15h.01" />
    </>
  ));

export const Check = (p) => svg(p, <path d="m5 13 4 4L19 7" />);

export const Alert = (p) =>
  svg(p, (
    <>
      <path d="M12 3 2 20h20z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ));

export const Clock = (p) =>
  svg(p, (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ));

export const Sun = (p) =>
  svg(p, (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ));

export const Moon = (p) => svg(p, <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />);

export const Spark = (p) =>
  svg(p, (
    <>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </>
  ));

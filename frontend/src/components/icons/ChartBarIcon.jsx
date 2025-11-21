export const ChartBarIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="3" y1="3" x2="3" y2="21" />
    <line x1="21" y1="21" x2="3" y2="21" />
    <rect x="7" y="12" width="3" height="6" />
    <rect x="12" y="7" width="3" height="11" />
    <rect x="17" y="3" width="3" height="15" />
  </svg>
);

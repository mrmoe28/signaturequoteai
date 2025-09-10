export const Badge = ({ children }: { children: React.ReactNode }) => (
  <span 
    style={{ 
      border: '1px solid var(--border)', 
      padding: '2px 8px', 
      borderRadius: 999, 
      fontSize: '12px',
      backgroundColor: 'var(--bg)',
      color: 'var(--subtle)'
    }}
  >
    {children}
  </span>
);
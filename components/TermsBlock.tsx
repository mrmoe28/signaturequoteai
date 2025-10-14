interface TermsBlockProps {
  text: string;
}

export default function TermsBlock({ text }: TermsBlockProps) {
  return (
    <div style={{ 
      marginTop: 12, 
      paddingTop: 12, 
      borderTop: '1px solid var(--border)', 
      color: '#475569', 
      fontSize: 13, 
      lineHeight: 1.5, 
      whiteSpace: 'pre-wrap' 
    }}>
      {text}
    </div>
  );
}
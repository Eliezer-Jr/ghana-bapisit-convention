interface InfoFieldProps {
  label: string;
  value: string | number;
  className?: string;
}

export const InfoField = ({ label, value, className = "" }: InfoFieldProps) => {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
};

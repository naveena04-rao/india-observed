export function VerificationStatus({
  status,
  detail,
  compact = false,
}: {
  status: string;
  detail?: string;
  compact?: boolean;
}) {
  const className = ["verification-status", compact ? "verification-status--compact" : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} aria-label="Record evidence state">
      <span className="verification-status__label">Verification</span>
      <strong>{status}</strong>
      {detail ? <span className="verification-status__detail">{detail}</span> : null}
    </div>
  );
}

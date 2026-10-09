'use client';

export default function FormField({ label, error, children, required = false, id }) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label} {required && <span className="ff-required">*</span>}
        </label>
      )}
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

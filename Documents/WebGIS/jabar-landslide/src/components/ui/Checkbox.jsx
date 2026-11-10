/** Checkbox kaca (adaptasi Uiverse.io/Shammy2002, MIT). */
export default function Checkbox({ checked, onChange, children, className = '' }) {
  return (
    <label className={`ui-check ${className}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="checkmark" aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}

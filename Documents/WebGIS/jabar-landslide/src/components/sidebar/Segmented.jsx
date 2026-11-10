/** Tombol pilihan bersegmen kecil. `options`: { value: label }. */
export default function Segmented({ options, value, onChange, isDisabled = () => false, disabledTitle }) {
  return (
    <div className="seg">
      {Object.entries(options).map(([key, label]) => (
        <button
          key={key}
          className={value === key ? 'active' : ''}
          disabled={isDisabled(key)}
          title={isDisabled(key) ? disabledTitle?.(key) : undefined}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

import { useId } from 'react';

/**
 * Grup pilihan tunggal bergaya radio orbit (adaptasi Uiverse.io/risabbir, MIT).
 * `options`: { value: label }. API sama dengan versi tombol segmen sebelumnya.
 */
export default function Segmented({ options, value, onChange, isDisabled = () => false, disabledTitle }) {
  const name = useId();
  return (
    <div className="ui-radio-group" role="radiogroup">
      {Object.entries(options).map(([key, label]) => (
        <label key={key} className="ui-radio" title={isDisabled(key) ? disabledTitle?.(key) : undefined}>
          <input
            type="radio"
            name={name}
            checked={String(value) === String(key)}
            disabled={isDisabled(key)}
            onChange={() => onChange(key)}
          />
          <span className="radio-custom" aria-hidden="true" />
          <span className="radio-text">{label}</span>
        </label>
      ))}
    </div>
  );
}

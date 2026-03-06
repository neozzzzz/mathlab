interface RangeNumericInputProps {
  idPrefix: string;
  label: string;
  minValue: number;
  maxValue: number;
  minInputLabel?: string;
  maxInputLabel?: string;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onMinBlur?: () => void;
  onMaxBlur?: () => void;
  onFocusSelect?: boolean;
  disabledMin?: boolean;
  disabledMax?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export function parseNumericInput(v: string): number {
  const raw = v.replace(/\D/g, "");
  return raw === "" ? 0 : parseInt(raw, 10);
}

export default function RangeNumericInput({
  idPrefix,
  label,
  minValue,
  maxValue,
  minInputLabel,
  maxInputLabel,
  onMinChange,
  onMaxChange,
  onMinBlur,
  onMaxBlur,
  onFocusSelect = false,
  disabledMin,
  disabledMax,
  containerClassName,
  labelClassName,
  inputClassName,
}: RangeNumericInputProps) {
  const minId = `${idPrefix}-min`;
  const maxId = `${idPrefix}-max`;

  return (
    <div className={containerClassName}>
      <label htmlFor={minId} className={labelClassName ?? "block text-xs text-slate-500 font-bold mb-2"}>
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          id={minId}
          type="text"
          inputMode="numeric"
          value={minValue}
          aria-label={minInputLabel ?? `${label} 최소값`}
          onChange={(e) => onMinChange(parseNumericInput(e.target.value))}
          onBlur={onMinBlur}
          onFocus={onFocusSelect ? (e) => e.target.select() : undefined}
          disabled={disabledMin}
          className={
            inputClassName ??
            "flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
          }
        />
        <span className="font-bold text-gray-400">~</span>
        <input
          id={maxId}
          type="text"
          inputMode="numeric"
          value={maxValue}
          aria-label={maxInputLabel ?? `${label} 최대값`}
          onChange={(e) => onMaxChange(parseNumericInput(e.target.value))}
          onBlur={onMaxBlur}
          onFocus={onFocusSelect ? (e) => e.target.select() : undefined}
          disabled={disabledMax}
          className={
            inputClassName ??
            "flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
          }
        />
      </div>
      <label htmlFor={maxId} className="sr-only">
        {maxInputLabel ?? `${label} 최대값`}
      </label>
    </div>
  );
}

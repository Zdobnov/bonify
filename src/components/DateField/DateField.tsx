import './DateField.css';

type DateFieldProps = {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

export const DateField = ({ disabled = false, label, onChange, value }: DateFieldProps) => (
  <label className="date-field">
    <span className="date-field__label">{label}</span>
    <input
      className="date-field__input"
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      type="date"
      value={value}
      name={`date-field-${label.toLowerCase()}`}
    />
  </label>
);

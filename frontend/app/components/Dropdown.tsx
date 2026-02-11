"use client";

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
};

export default function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
}: DropdownProps) {
  return (
    <label className="field">
      {label}
      <select
        className="dropdown"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

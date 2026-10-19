import Input from "@/components/form/input/InputField";
import { SearchIcon } from "@/icons";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
}

/** Text input with a leading magnifier icon, used by list toolbars. */
export default function SearchInput({
  value,
  onChange,
  placeholder,
  id,
  "aria-label": ariaLabel,
}: SearchInputProps) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute inset-s-3 top-1/2 z-1 size-5 -translate-y-1/2 text-gray-400" />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="ps-10"
      />
    </div>
  );
}

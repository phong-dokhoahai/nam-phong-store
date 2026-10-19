import ComponentCard from "@/components/common/ComponentCard";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { EyeCloseIcon, EyeIcon, MastercardIcon, TimeIcon } from "@/icons";
import { cn } from "@/utils";
import { useState } from "react";

export default function DefaultInputs() {
  const [showPassword, setShowPassword] = useState(false);
  const options = [
    { value: "marketing", label: "Marketing" },
    { value: "template", label: "Template" },
    { value: "development", label: "Development" },
  ];
  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };

  return (
    <ComponentCard title="Default Inputs">
      <div className={cn("space-y-6")}>
        <div>
          <Label htmlFor="input">Input</Label>
          <Input type="text" id="input" />
        </div>
        <div>
          <Label htmlFor="inputTwo">Input with Placeholder</Label>
          <Input type="text" id="inputTwo" placeholder="info@gmail.com" />
        </div>
        <div>
          <Label>Select Input</Label>
          <Select
            options={options}
            placeholder="Select an option"
            onChange={handleSelectChange}
            className="dark:bg-dark-900"
          />
        </div>
        <div>
          <Label>Password Input</Label>
          <div className={cn("relative")}>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className={cn("absolute end-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer")}
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeIcon className={cn("size-5 fill-gray-500 dark:fill-gray-400")} />
              ) : (
                <EyeCloseIcon className={cn("size-5 fill-gray-500 dark:fill-gray-400")} />
              )}
            </button>
          </div>
        </div>

        <div>
          <DatePicker
            id="date-picker"
            label="Date Picker Input"
            placeholder="Select a date"
            onChange={(dates, currentDateString) => {
              // Handle your logic
              console.log({ dates, currentDateString });
            }}
          />
        </div>

        <div>
          <Label htmlFor="tm">Time Picker Input</Label>
          <div className={cn("relative")}>
            <Input
              type="time"
              id="tm"
              name="tm"
              onChange={(e) => console.log(e.target.value)}
            />
            <span className={cn("pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400")}>
              <TimeIcon className={cn("size-6")} />
            </span>
          </div>
        </div>
        <div>
          <Label htmlFor="card-payment">Input with Payment</Label>
          <div className={cn("relative")}>
            <Input
              id="card-payment"
              type="text"
              placeholder="Card number"
              className="ps-[62px]"
            />
            <span className={cn("absolute start-0 top-1/2 flex h-11 w-[46px] -translate-y-1/2 items-center justify-center border-e border-gray-200 dark:border-gray-800")}>
              <MastercardIcon />
            </span>
          </div>
        </div>
      </div>
    </ComponentCard>
  );
}


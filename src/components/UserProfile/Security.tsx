import { EditLineIcon } from "@/icons";
import { useState } from "react";

export default function Security() {
  const [switcherToggle, setSwitcherToggle] = useState(false);

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 lg:mb-6 dark:text-white/90">
        Security
      </h4>
      <div>
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-end dark:border-gray-800">
          <div>
            <span className="mb-1 block text-base font-medium text-gray-800 dark:text-white/90">
              Change Password
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive real-time notifications and team alerts.
            </p>
          </div>
          <div>
            <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200">
              <EditLineIcon />
              Change Password
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-end dark:border-gray-800">
          <div>
            <span className="mb-1 block text-base font-medium text-gray-800 dark:text-white/90">
              Two-factor authentication (2FA)
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Keep your account secure by enabling 2FA
            </p>
          </div>
          <div>
            <label
              htmlFor="toggle1"
              className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700 select-none dark:text-gray-400"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  id="toggle1"
                  className="sr-only"
                  checked={switcherToggle}
                  onChange={(e) => setSwitcherToggle(e.target.checked)}
                />
                <div
                  className={`block h-5 w-9 rounded-full duration-200 ${
                    switcherToggle
                      ? "bg-brand-500 dark:bg-brand-500"
                      : "bg-gray-200 dark:bg-white/10"
                  }`}
                ></div>
                <div
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-theme-sm duration-200 ease-linear ${
                    switcherToggle ? "translate-x-full" : "translate-x-0"
                  }`}
                ></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

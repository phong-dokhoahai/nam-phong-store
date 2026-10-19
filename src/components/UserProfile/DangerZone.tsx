import { LogoutIcon, TrashOutlineIcon } from "@/icons";
export default function DangerZone() {
  return (
    <div className="mb-6 rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 lg:mb-6 dark:text-white/90">
        Danger Zone
      </h4>
      <div>
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-end dark:border-gray-800">
          <div>
            <span className="mb-1 block text-base font-medium text-gray-800 dark:text-white/90">
              Logout all devices
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign out from every active session.
            </p>
          </div>
          <div>
            <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200">
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-end dark:border-gray-800">
          <div>
            <span className="mb-1 block text-base font-medium text-gray-800 dark:text-white/90">
              Delete account
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
          </div>
          <div>
            <button className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-error-500 px-3.5 py-2.5 pr-4 pl-3.5 text-sm font-medium text-error-500 transition-all hover:bg-error-100 dark:border-error-500/15 dark:hover:bg-red-500/15">
              <TrashOutlineIcon />
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

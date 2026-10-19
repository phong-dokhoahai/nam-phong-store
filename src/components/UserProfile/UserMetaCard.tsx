import { useModal } from "../../hooks/useModal";
import {
  CameraIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  PencilIcon,
  XSocialIcon,
} from "../../icons";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };
  return (
    <>
      <div className="mb-6 rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
        <div className="flex flex-col gap-5 sm:flex-row xl:gap-10">
          <div className="flex-1">
            <div className="mb-6 flex flex-col gap-5 sm:flex-row xl:items-center xl:justify-between">
              <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center">
                <div className="border-gray-20 overflow-hidden rounded-full border dark:border-gray-800">
                  <img
                    src="./images/user/owner.png"
                    className="size-20"
                    alt="user"
                  />
                </div>
                <div className="text-left">
                  <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
                    Musharof Chowdhury
                  </h4>
                  <div className="flex items-center gap-1 sm:gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Team Manager
                    </p>
                    <div className="hidden h-3.5 w-px bg-gray-300 sm:block dark:bg-gray-700"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Arizona, United States.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-x-11 xl:gap-y-7">
              <div className="w-full">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  First Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Chowdury
                </p>
              </div>
              <div className="w-full">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Last Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Musharof
                </p>
              </div>
              <div className="hidden xl:block"></div>
              <div className="hidden xl:block"></div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  randomuser@pimjo.com
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  +09 363 398 46
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Bio
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Team Manager
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Social Links
                </p>
                <div className="flex grow items-center gap-4">
                  <a
                    href="#"
                    className="size-5 text-sm font-medium text-gray-700 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FacebookIcon className="fill-current" />
                  </a>
                  <a
                    href="#"
                    className="size-5 text-sm font-medium text-gray-700 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XSocialIcon className="fill-current" />
                  </a>
                  <a
                    href="#"
                    className="size-5 text-sm font-medium text-gray-700 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <LinkedinIcon className="fill-current" />
                  </a>
                  <a
                    href="#"
                    className="size-5 text-sm font-medium text-gray-700 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <InstagramIcon className="fill-current" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={openModal}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 lg:inline-flex lg:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200"
            >
              <PencilIcon className="size-4.5" />
              Edit
            </button>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px]">
        <div className="relative no-scrollbar w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 lg:p-11 dark:bg-gray-900">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 lg:mb-7 dark:text-gray-400">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
                  Change Profile Picture
                </h4>
                <div className="mb-6 flex max-w-sm items-center gap-6 lg:pr-5">
                  <div className="relative size-20 shrink-0 rounded-full sm:size-25">
                    <img
                      src="/images/user/owner.png"
                      alt="Profile Picture"
                      className="size-20 rounded-full object-cover sm:size-25"
                    />
                    <label
                      htmlFor="file-upload"
                      className="absolute right-0 bottom-0 flex size-8 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                    >
                      <input
                        type="file"
                        name="file-upload"
                        id="file-upload"
                        className="hidden"
                      />
                      <CameraIcon />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload a square image (200×200 px) in JPEG or PNG format.
                    </p>
                  </div>
                </div>
              </div>

              <div className="my-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 lg:mb-6 dark:text-white/90">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input type="text" value="Musharof" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input type="text" value="Chowdhury" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input type="text" value="randomuser@pimjo.com" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input type="text" value="+09 363 398 46" />
                  </div>

                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input type="text" value="Team Manager" />
                  </div>
                </div>
              </div>
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 lg:mb-6 dark:text-white/90">
                  Social Links
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      type="text"
                      value="https://www.facebook.com/PimjoHQ"
                    />
                  </div>

                  <div>
                    <Label>X.com</Label>
                    <Input type="text" value="https://x.com/PimjoHQ" />
                  </div>

                  <div>
                    <Label>Linkedin</Label>
                    <Input
                      type="text"
                      value="https://www.linkedin.com/company/pimjo"
                    />
                  </div>

                  <div>
                    <Label>Instagram</Label>
                    <Input type="text" value="https://instagram.com/PimjoHQ" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

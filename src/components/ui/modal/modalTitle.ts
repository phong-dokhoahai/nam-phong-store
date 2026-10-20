import { createContext, useContext } from "react";

export const ModalTitleIdContext = createContext<string | undefined>(undefined);

/**
 * Id the surrounding `Modal` uses for `aria-labelledby`. Put it on a custom
 * heading when the dialog does not use `ModalHeader`.
 */
export const useModalTitleId = () => useContext(ModalTitleIdContext);

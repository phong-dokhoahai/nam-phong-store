import { ChevronRightIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface BreadcrumbProps {
  pageTitle: string;
}

/** Page title + "Home › Page" trail; first element of every admin page. */
const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-fg">{pageTitle}</h2>
      <nav aria-label={t("common.breadcrumb")}>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-fg-muted"
              to="/"
            >
              {t("common.home")}
              <ChevronRightIcon className="stroke-current rtl:rotate-180" />
            </Link>
          </li>
          <li aria-current="page" className="text-sm text-fg">
            {pageTitle}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;

import EmptyState from "@/components/common/EmptyState";
import Badge from "@/components/ui/badge/Badge";
import IconButton from "@/components/ui/button/IconButton";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckLineIcon, EyeIcon, PencilIcon } from "@/icons";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatQuantity } from "@/utils/formatQuantity";
import { useTranslation } from "react-i18next";
import type { StockIssue, StockIssueStatus } from "./types";

type StockIssuesTableProps = {
  issues: StockIssue[];
  selectedIssueId: string;
  onSelect: (issue: StockIssue) => void;
  onConfirm: (issue: StockIssue) => void;
};

const statusColor: Record<
  StockIssueStatus,
  "success" | "warning" | "error" | "light"
> = {
  DRAFT: "warning",
  CONFIRMED: "success",
  CANCELLED: "light",
};

export default function StockIssuesTable({
  issues,
  selectedIssueId,
  onSelect,
  onConfirm,
}: StockIssuesTableProps) {
  const { t } = useTranslation();

  if (issues.length === 0) {
    return (
      <EmptyState
        title={t("stockIssues.empty.title")}
        description={t("stockIssues.empty.description")}
      />
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>{t("stockIssues.table.issue")}</TableCell>
            <TableCell isHeader>{t("stockIssues.table.customer")}</TableCell>
            <TableCell isHeader>{t("stockIssues.table.lines")}</TableCell>
            <TableCell isHeader align="end">
              {t("stockIssues.table.total")}
            </TableCell>
            <TableCell isHeader>{t("stockIssues.table.status")}</TableCell>
            <TableCell isHeader align="end">
              {t("stockIssues.table.actions")}
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => {
            const isDraft = issue.status === "DRAFT";
            const SelectIcon = isDraft ? PencilIcon : EyeIcon;
            const selectLabel = isDraft
              ? t("stockIssues.actions.edit")
              : t("stockIssues.actions.view");

            return (
              <TableRow
                key={issue.id}
                className={
                  issue.id === selectedIssueId
                    ? "bg-brand-50/60 dark:bg-brand-500/10"
                    : ""
                }
              >
                <TableCell>
                  <p className="font-medium text-fg">{issue.code}</p>
                  <p className="mt-1 text-theme-xs">{issue.issueDate}</p>
                </TableCell>
                <TableCell>{issue.customerName}</TableCell>
                <TableCell>
                  {t("stockIssues.table.lineSummary", {
                    count: issue.lines.length,
                    quantity: formatQuantity(
                      issue.lines.reduce((sum, line) => sum + line.quantity, 0),
                    ),
                  })}
                </TableCell>
                <TableCell align="end" className="font-medium text-fg">
                  {formatCurrency(issue.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge color={statusColor[issue.status]} size="sm">
                    {t(`stockIssues.status.${issue.status}`)}
                  </Badge>
                </TableCell>
                <TableCell align="end">
                  <div className="flex justify-end gap-2">
                    <IconButton
                      icon={<SelectIcon className="size-4" />}
                      label={selectLabel}
                      onClick={() => onSelect(issue)}
                    />
                    <IconButton
                      icon={<CheckLineIcon className="size-4" />}
                      label={t("stockIssues.actions.confirm")}
                      tone="success"
                      onClick={() => onConfirm(issue)}
                      disabled={
                        issue.status !== "DRAFT" || issue.lines.length === 0
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

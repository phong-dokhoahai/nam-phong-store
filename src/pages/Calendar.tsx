import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/palette.css";
import "@fullcalendar/react/themes/classic/theme.css";

export default function CalendarPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Calendar" />
      <Calendar />
    </div>
  );
}

import React, { useState } from "react";
import FullCalendar, {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // For drag & drop
import { Modal, Input, Switch, DatePicker, TimePicker, Button, Select } from "antd";
import moment from "moment";

// Define the structure of a calendar event
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string; // Optional end time for long events
  backgroundColor?: string;
  status?: "Pending" | "Complete" | "In Progress"; // Event status
}

const App: React.FC = () => {
  // State to manage events on the calendar
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Meeting",
      start: "2025-02-18T10:00:00",
      end: "2025-02-18T12:00:00",
      backgroundColor: "#ff5733",
      status: "Pending",
    },
    {
      id: "2",
      title: "Workshop",
      start: "2025-02-19T14:00:00",
      end: "2025-02-21T16:00:00",
      backgroundColor: "#33aaff",
      status: "In Progress",
    },
  ]);

  // State for modal visibility
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // State for form inputs
  const [eventTitle, setEventTitle] = useState<string>("");
  const [startDate, setStartDate] = useState<moment.Moment | null>(null);
  const [startTime, setStartTime] = useState<moment.Moment | null>(null);
  const [endDate, setEndDate] = useState<moment.Moment | null>(null);
  const [endTime, setEndTime] = useState<moment.Moment | null>(null);
  const [status, setStatus] = useState<"Pending" | "Complete" | "In Progress">("Pending");

  // State to toggle weekends visibility
  const [weekendsVisible, setWeekendsVisible] = useState<boolean>(true);

  // Handle selecting a date/time slot
  const handleDateSelect = (arg: DateSelectArg) => {
    if (new Date(arg.start).getDay() === 0) return; // Disable Sunday

    const today = new Date().setHours(0, 0, 0, 0);
    const selectedDate = new Date(arg.startStr).setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert("You cannot add events on past dates!");
      return;
    }

    // Pre-fill the modal with the selected date and time
    setStartDate(moment(arg.startStr));
    setStartTime(moment(arg.startStr));
    setEndDate(moment(arg.endStr || arg.startStr));
    setEndTime(moment(arg.endStr || arg.startStr));

    setModalVisible(true); // Open the modal for adding an event
  };

  // Add or update an event
  const handleAddOrUpdateEvent = () => {
    if (!eventTitle.trim()) {
      alert("Please enter an event title!");
      return;
    }
    if (!startDate || !startTime || !endDate || !endTime) {
      alert("Please select both start and end date/time!");
      return;
    }

    const startDateTime = `${startDate.format("YYYY-MM-DD")}T${startTime.format("HH:mm:ss")}`;
    const endDateTime = `${endDate.format("YYYY-MM-DD")}T${endTime.format("HH:mm:ss")}`;

    setEvents([
      ...events,
      {
        id: Date.now().toString(),
        title: eventTitle,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: status === "Complete" ? "#2ecc71" : "#e74c3c", // Green for Complete, Red for Pending/In Progress
        status: status,
      },
    ]);

    // Reset form inputs
    setEventTitle("");
    setStartDate(null);
    setStartTime(null);
    setEndDate(null);
    setEndTime(null);
    setStatus("Pending");
    setModalVisible(false); // Close the modal
  };

  // Handle deleting an event
  const handleEventClick = (info: EventClickArg) => {
    const event = events.find((e) => e.id === info.event.id);
    if (!event) return;

    if (confirm(`Delete event: "${event.title}"?`)) {
      setEvents(events.filter((e) => e.id !== event.id));
    }
  };

  // Handle dragging and dropping an event to a new date/time
  const handleEventDrop = (info: EventDropArg) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const newDate = new Date(info.event.startStr).setHours(0, 0, 0, 0);

    if (newDate < today) {
      alert("You cannot move events to past dates!");
      info.revert(); // Undo the move
      return;
    }

    setEvents(
      events.map((event) =>
        event.id === info.event.id
          ? { ...event, start: info.event.startStr, end: info.event.endStr }
          : event
      )
    );
  };

  return (
    <div style={{ width: "90%", margin: "20px auto", padding: "10px" }}>
      <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>
        Event Management Calendar
      </h2>

      {/* Toggle for showing/hiding weekends */}
      <div style={{ marginBottom: "10px" }}>
        <label>Show Weekends:</label>
        <Switch
          style={{ marginLeft: 20 }}
          checked={weekendsVisible}
          onChange={() => setWeekendsVisible(!weekendsVisible)}
        />
      </div>

      {/* FullCalendar Component */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable={true}
        editable={true} // Allows drag & drop
        weekends={weekendsVisible} // Show or hide weekends
        events={events.map((event) => ({
          ...event,
          display: "block",
          borderColor: event.status === "Complete" ? "green" : event.status === "In Progress" ? "orange" : "red",
        }))}
        select={handleDateSelect} // Handle date selection
        eventClick={handleEventClick} // Handle event click (delete)
        eventDrop={handleEventDrop} // Enable drag & drop
        height={600} // Adjust calendar size
        slotMinTime="08:00:00" // Start time at 8 AM
        slotMaxTime="20:00:00" // End time at 8 PM
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        dayCellClassNames={(dateInfo) =>
          dateInfo.date.getDay() === 6 ? "disabled-day" : "" // Apply class to Sunday
        }
        dayCellDidMount={(info) => {
          const day = info.date.getDay(); // 0 = Sunday, 6 = Saturday
          if (day === 6) {
            // Fades out Sundays
            info.el.style.opacity = "0.5"; // Reduce opacity
            info.el.style.backgroundColor = "#f0f0f0"; // Light grey background
          }
        }}
        dayCellContent={(dateInfo) => (
          <div
            style={{
              opacity: dateInfo.date.getDay() === 6 ? 0.5 : 1, // Fade out Sunday
              color: dateInfo.date.getDay() === 6 ? "red" : "black", // Red text for Sunday
              pointerEvents: dateInfo.date.getDay() === 6 ? "none" : "auto", // Disable clicking on Sunday
            }}
          >
            {dateInfo.dayNumberText}
          </div>
        )}
      />

      {/* Modal for Adding or Editing an Event */}
      <Modal
        title="Add New Event"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleAddOrUpdateEvent}>
            Add Event
          </Button>,
        ]}
      >
        <div style={{ marginBottom: "10px" }}>
          <label>Event Title:</label>
          <Input
            placeholder="Enter Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Start Date:</label>
          <DatePicker
            style={{ width: "100%" }}
            value={startDate}
            onChange={(date) => setStartDate(date)}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Start Time:</label>
          <TimePicker
            style={{ width: "100%" }}
            value={startTime}
            onChange={(time) => setStartTime(time)}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>End Date:</label>
          <DatePicker
            style={{ width: "100%" }}
            variant="filled"
            value={endDate}
            onChange={(date) => setEndDate(date)}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>End Time:</label>
          <TimePicker
            style={{ width: "100%" }}
            value={endTime}
            onChange={(time) => setEndTime(time)}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Status:</label>
          <Select
            style={{ width: "100%" }}
            value={status}
            onChange={(value) => setStatus(value)}
          >
            <Select.Option value="Pending">Pending</Select.Option>
            <Select.Option value="In Progress">In Progress</Select.Option>
            <Select.Option value="Complete">Complete</Select.Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default App;
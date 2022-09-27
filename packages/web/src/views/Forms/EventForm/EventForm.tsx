import dayjs from "dayjs";
import React, { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { Key } from "ts-keycode-enum";
import { Priorities } from "@core/constants/core.constants";
import { Schema_Event } from "@core/types/event.types";
import { DeleteIcon } from "@web/components/Icons";
import { SelectOption } from "@web/common/types/components";
import {
  HOURS_MINUTES_FORMAT,
  HOURS_AM_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
} from "@web/common/constants/date.constants";

import { FormProps } from "./types";
import { DateTimeSection } from "./DateTimeSection";
import { PrioritySection } from "./PrioritySection";
import { SaveSection } from "./SaveSection";
import {
  StyledEventForm,
  StyledDescriptionField,
  StyledIconRow,
  StyledTitleField,
} from "./styled";

export const EventForm: React.FC<FormProps> = ({
  event,
  onClose: _onClose,
  onDelete,
  onSubmit,
  setEvent,
  ...props
}) => {
  const { priority, title } = event || {};

  /********
   * State
   ********/
  const [endTime, setEndTime] = useState<SelectOption<string> | undefined>();
  const [isShiftKeyPressed, toggleShiftKeyPressed] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [startTime, setStartTime] = useState<
    SelectOption<string> | undefined
  >();
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();
  const [selectedStartDate, setSelectedStartDate] = useState<
    Date | undefined
  >();

  /******************
   * Date Calculations
   ******************/
  const calculatedInitialStartTimeDayJs =
    event?.startDate && dayjs(event.startDate);
  const calculatedInitialEndTimeDayJs =
    event?.startDate && dayjs(event.endDate);

  const initialStartTime = calculatedInitialStartTimeDayJs && {
    value: calculatedInitialStartTimeDayJs.format(HOURS_MINUTES_FORMAT),
    label: calculatedInitialStartTimeDayJs.format(HOURS_AM_FORMAT),
  };

  const initialEndTime = calculatedInitialEndTimeDayJs && {
    value: calculatedInitialEndTimeDayJs.format(HOURS_MINUTES_FORMAT),
    label: calculatedInitialEndTimeDayJs.format(HOURS_AM_FORMAT),
  };

  const initialStartDate = event?.startDate
    ? dayjs(event?.startDate).toDate()
    : new Date();

  const initialEndDate = event?.endDate
    ? dayjs(event.endDate).toDate()
    : new Date();

  /********
   * Effect
   *********/

  const keyDownHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.which === Key.Shift) {
        toggleShiftKeyPressed(true);
      }

      if (e.which === Key.Escape) {
        setTimeout(_onClose);
        return;
      }
    },
    [_onClose]
  );
  const keyUpHandler = useCallback((e: KeyboardEvent) => {
    if (e.which === Key.Shift) {
      toggleShiftKeyPressed(false);
    }
  }, []);

  useEffect(() => {
    console.log("in key[updown] effect");
    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);

    return () => {
      window.removeEventListener("keydown", keyDownHandler);
      window.addEventListener("keyup", keyUpHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setEvent(event || {});
    setStartTime(initialStartTime || undefined);
    setEndTime(initialEndTime || undefined);
    setSelectedStartDate(initialStartDate);
    setSelectedEndDate(initialEndDate);
    setIsFormOpen(true);
  }, []);

  /*********
   * Handlers
   **********/
  const onChangeEventTextField =
    (fieldName: "title" | "description") =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onSetEventField(fieldName, e.target.value);
    };

  const onClose = () => {
    setIsFormOpen(false);

    setTimeout(() => {
      _onClose();
    }, 120);
  };

  const onDeleteForm = () => {
    onDelete(event._id);
    onClose();
  };

  const addTimesToDates = () => {
    const startDate = dayjs(selectedStartDate)
      .hour(parseInt(startTime.value.slice(0, 2)))
      .minute(parseInt(startTime.value.slice(3, 5)))
      .format();

    const endDate = dayjs(selectedEndDate)
      .hour(parseInt(endTime.value.slice(0, 2)))
      .minute(parseInt(endTime.value.slice(3, 5)))
      .format();

    return { startDate, endDate };
  };

  const getFinalDates = () => {
    if (event?.isAllDay) {
      return {
        startDate: dayjs(selectedStartDate).format(YEAR_MONTH_DAY_FORMAT),
        endDate: dayjs(selectedEndDate).format(YEAR_MONTH_DAY_FORMAT),
      };
    } else {
      const { startDate, endDate } = addTimesToDates();
      return { startDate, endDate };
    }
  };

  const ignoreDelete = (e: KeyboardEvent) => {
    if (e.which === Key.Backspace) {
      e.stopPropagation();
    }
  };

  const onSubmitForm = () => {
    const { startDate, endDate } = getFinalDates();

    if (dayjs(startDate).isAfter(dayjs(endDate))) {
      alert("uff-dah, looks like you got the start & end dates mixed up");
      return;
    }

    const finalEvent = {
      ...event,
      priority: event.priority || Priorities.UNASSIGNED,
      startDate,
      endDate,
    };

    onSubmit(finalEvent);

    onClose();
  };

  // $$ TODO make it easy for someday event form to use this
  const onSetEventField = <FieldName extends keyof Schema_Event>(
    fieldName: FieldName,
    value: Schema_Event[FieldName]
  ) => {
    const newEvent = { ...event, [fieldName]: value };
    setEvent(newEvent);
  };

  const submitFormWithKeyboard: React.KeyboardEventHandler<HTMLFormElement> = (
    e
  ) => {
    if (e.which === Key.Backspace || e.which == Key.Delete) {
      const isDraft = !event._id;
      if (isDraft) {
        onClose();
        return;
      }

      const confirmed = window.confirm(
        `Delete ${event.title || "this event"}?`
      );
      if (confirmed) {
        onDeleteForm();
        return;
      }
    }
    const shouldIgnore = isShiftKeyPressed || e.which !== Key.Enter;
    if (shouldIgnore) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    onSubmitForm();
  };

  return (
    <StyledEventForm
      {...props}
      isOpen={isFormOpen}
      name="Event Form"
      onKeyDown={submitFormWithKeyboard}
      onMouseUp={(e) => {
        if (isStartDatePickerOpen) {
          setIsStartDatePickerOpen(false);
        }
        if (isEndDatePickerOpen) {
          setIsEndDatePickerOpen(false);
        }
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      priority={priority}
      role="form"
    >
      <StyledIconRow>
        <DeleteIcon onDelete={onDeleteForm} title="Delete Event" />
      </StyledIconRow>

      <StyledTitleField
        autoFocus
        placeholder="Title"
        onChange={onChangeEventTextField("title")}
        onKeyDown={ignoreDelete}
        // onKeyDown={(e) => ignoreDelete(e)}
        role="textarea"
        name="Event Title"
        value={title}
      />

      <PrioritySection onSetEventField={onSetEventField} priority={priority} />

      <DateTimeSection
        endTime={endTime}
        isAllDay={event.isAllDay}
        isEndDatePickerShown={isEndDatePickerOpen}
        isStartDatePickerShown={isStartDatePickerOpen}
        selectedEndDate={selectedEndDate}
        selectedStartDate={selectedStartDate}
        setEndTime={setEndTime}
        setSelectedEndDate={setSelectedEndDate}
        setSelectedStartDate={setSelectedStartDate}
        setStartTime={setStartTime}
        startTime={startTime}
        setIsEndDatePickerOpen={setIsEndDatePickerOpen}
        setIsStartDatePickerOpen={setIsStartDatePickerOpen}
      />

      <StyledDescriptionField
        onChange={onChangeEventTextField("description")}
        onKeyDown={ignoreDelete}
        placeholder="Description"
        value={event.description || ""}
      />

      <SaveSection priority={priority} onSubmit={onSubmitForm} />
    </StyledEventForm>
  );
};

/* //++
  // const getDateStrWithTimes = (field: "start" | "end") => {
  //   if (field === "start") {
  //     return dayjs(selectedStartDate)
  //       .hour(parseInt(startTime.value.slice(0, 2)))
  //       .minute(parseInt(startTime.value.slice(3, 5)))
  //       .format();
  //   } else if (field === "end") {
  //     dayjs(selectedEndDate)
  //       .hour(parseInt(endTime.value.slice(0, 2)))
  //       .minute(parseInt(endTime.value.slice(3, 5)))
  //       .format();
  //   }
  // };

*/

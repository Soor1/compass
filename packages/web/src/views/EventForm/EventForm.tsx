import React, { useEffect, useState } from "react";
import { Key } from "ts-keycode-enum";
import dayjs from "dayjs";
import { Priorities } from "@core/core.constants";
import { Schema_Event } from "@core/types/event.types";
import { Button } from "@web/components/Button";
import { JustifyContent } from "@web/components/Flex/styled";
import { SelectOption } from "@web/common/types/components";
import { colorNameByPriority } from "@web/common/styles/colors";
import {
  HOURS_MINUTES_FORMAT,
  HOURS_AM_FORMAT,
  YEAR_MONTH_DAY_FORMAT,
} from "@web/common/constants/dates";

import {
  Styled,
  StyledTitleField,
  StyledPriorityFlex,
  StyledDescriptionField,
  StyledDeleteButton,
  StyledSubmitButton,
  StyledSubmitRow,
} from "./styled";
import { ComponentProps } from "./types";
import { DateTimePickersSection } from "./DateTimePickersSection";
import { selectAreEventsProcessingBySectionType } from "../../ducks/events/selectors";

export const EventForm: React.FC<ComponentProps> = ({
  onClose: _onClose,
  onDelete,
  onSubmit,
  event,
  setEvent,
  ...props
}) => {
  const { priority, title, showStartTimeLabel } = event || {};

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

  const [startTime, setStartTime] = useState<
    SelectOption<string> | undefined
  >();
  const [endTime, setEndTime] = useState<SelectOption<string> | undefined>();

  const initialStartDate = event?.startDate
    ? dayjs(event?.startDate).toDate()
    : new Date();

  const initialEndDate = event?.endDate
    ? dayjs(event.endDate).toDate()
    : new Date();

  const [selectedStartDate, setSelectedStartDate] = useState<
    Date | undefined
  >();

  const defaultEventState: Schema_Event = {
    priority: event.priority,
    title: "",
    description: "",
    isAllDay: false,
    startDate: "",
    endDate: "",
    origin: event.origin,
    showStartTimeLabel: false,
  };

  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();

  const [isShiftKeyPressed, toggleShiftKeyPressed] = useState(false);
  const [isOpen, toggleForm] = useState(false);

  const onClose = () => {
    toggleForm(false);

    setTimeout(() => {
      _onClose();
    }, 300);
  };

  useEffect(() => {
    setEvent(event || defaultEventState);
    setStartTime(initialStartTime || undefined);
    setEndTime(initialEndTime || undefined);
    setSelectedStartDate(initialStartDate);
    setSelectedEndDate(initialEndDate);

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.which === Key.Shift) {
        toggleShiftKeyPressed(true);
      }

      if (e.which !== Key.Escape) return;

      setTimeout(onClose);
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.which === Key.Shift) {
        toggleShiftKeyPressed(false);
      }
    };

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    toggleForm(true);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, []);

  const onDeleteForm = () => {
    onDelete(event._id);
    onClose();
  };

  const onSubmitForm = () => {
    const startDateString = dayjs(selectedStartDate).format(
      YEAR_MONTH_DAY_FORMAT
    );
    const endDateString = dayjs(selectedEndDate).format(YEAR_MONTH_DAY_FORMAT);

    const startDate = event?.isAllDay
      ? startDateString
      : `${startDateString} ${startTime?.value || ""}`;
    const endDate = event?.isAllDay
      ? endDateString
      : `${endDateString} ${endTime?.value || ""}`;

    const _event = { ...event };

    onSubmit({
      ..._event,
      priority: _event.priority || Priorities.UNASSIGNED,
      startDate,
      endDate,
      isTimeSelected: !!startTime,
    });

    onClose();
  };

  const onSetEventField = <FieldName extends keyof Schema_Event>(
    fieldName: FieldName,
    value: Schema_Event[FieldName]
  ) => {
    setEvent((_event) => ({
      ..._event,
      [fieldName]: value,
    }));
  };

  const onChangeEventTextField =
    (fieldName: "title" | "description") =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onSetEventField(fieldName, e.target.value);
    };

  const submitFormWithKeyboard: React.KeyboardEventHandler<
    HTMLTextAreaElement
  > = (e) => {
    if (isShiftKeyPressed || e.which !== Key.Enter) return;

    e.preventDefault();
    e.stopPropagation();

    onSubmitForm();
  };

  return (
    <Styled
      {...props}
      isOpen={isOpen}
      priority={priority}
      onMouseDown={(e) => e.stopPropagation()}
      role="form"
      title="Event Form"
    >
      <StyledTitleField
        autoFocus={true}
        placeholder="Title"
        onKeyDown={submitFormWithKeyboard}
        value={title}
        onChange={onChangeEventTextField("title")}
      />

      {!event.isAllDay && (
        <DateTimePickersSection
          setEndTime={setEndTime}
          setStartTime={setStartTime}
          setSelectedDate={setSelectedStartDate}
          endTime={endTime}
          startTime={startTime}
          selectedDate={selectedStartDate}
          showStartTimeLabel={!!showStartTimeLabel}
          setShowStartTimeLabel={(value) =>
            onSetEventField("showStartTimeLabel", !!value)
          }
        />
      )}

      <StyledPriorityFlex justifyContent={JustifyContent.SPACE_BETWEEN}>
        <Button
          bordered={priority === Priorities.WORK}
          color={colorNameByPriority.work}
          onClick={() => onSetEventField("priority", Priorities.WORK)}
          onFocus={() => onSetEventField("priority", Priorities.WORK)}
          role="tab"
          tabIndex={0}
        >
          Work
        </Button>

        <Button
          bordered={priority === Priorities.SELF}
          color={colorNameByPriority.self}
          onClick={() => onSetEventField("priority", Priorities.SELF)}
          onFocus={() => onSetEventField("priority", Priorities.SELF)}
          role="tab"
          tabIndex={0}
        >
          Self
        </Button>

        <Button
          bordered={priority === Priorities.RELATIONS}
          color={colorNameByPriority.relations}
          onClick={() => onSetEventField("priority", Priorities.RELATIONS)}
          onFocus={() => onSetEventField("priority", Priorities.RELATIONS)}
          role="tab"
          tabIndex={0}
        >
          Relationships
        </Button>
      </StyledPriorityFlex>

      <StyledDescriptionField
        onChange={onChangeEventTextField("description")}
        placeholder="Description"
        value={event.description || ""}
      />

      <StyledSubmitRow>
        <StyledSubmitButton bordered={true} onClick={onSubmitForm}>
          Submit
        </StyledSubmitButton>
        <StyledDeleteButton onClick={onDeleteForm}>Delete</StyledDeleteButton>
      </StyledSubmitRow>
    </Styled>
  );
};

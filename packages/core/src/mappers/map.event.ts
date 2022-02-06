/* eslint-disable @typescript-eslint/no-namespace */
import { gSchema$Event } from "@compass/backend/declarations";
import { notCancelled } from "@compass/backend/src/common/services/gcal/gcal.helpers";
import { Logger } from "@compass/backend/src/common/logger/common.logger";

import { BaseError } from "@core/errors/errors.base";
import { Origin } from "@core/core.constants";

import { Schema_Event } from "../types/event.types";
import { isAllDay } from "@core/util/event.util";

const logger = Logger("app:map.event");

export namespace MapEvent {
  export const toCompass = (
    userId: string,
    events: gSchema$Event[],
    origin: Origin
  ): Schema_Event[] => {
    const mapped = events
      .filter(notCancelled)
      .map((e: gSchema$Event) => _toCompass(userId, e, origin));

    return mapped;
  };

  export const toGcal = (
    userId: string,
    event: Schema_Event
  ): gSchema$Event => {
    const dateKey = isAllDay(event) ? "date" : "datetime";

    const gcalEvent: gSchema$Event = {
      summary: event.title, // TODO only add this field if not undefined
      description: event.description, // TODO only add this field if not undefined
      start: { [dateKey]: event.startDate },
      end: { [dateKey]: event.endDate },
      extendedProperties: {
        private: {
          // capture where event came from to later decide how to
          // sync changes between compass and integrations
          origin: event.origin,
        },
      },
    };

    return gcalEvent;
  };
}

const _toCompass = (
  userId: string,
  gEvent: gSchema$Event,
  origin: Origin
): Schema_Event => {
  // TODO - move to validation service
  if (!gEvent.id) {
    throw new BaseError(
      "Bad Google Event Id",
      "You got a google event without an Id, something is off",
      500,
      false
    );
  }
  //TODO validate that event has either date or dateTime values

  const gEventId = gEvent.id ? gEvent.id : "uh oh";
  const title = gEvent.summary ? gEvent.summary : "untitled";
  const description = gEvent.description ? gEvent.description : "";

  const isAllDay = "date" in gEvent.start;

  const compassEvent: Schema_Event = {
    gEventId: gEventId,
    user: userId,
    origin: origin,
    title: title,
    description: description,
    priorities: [],
    startDate: isAllDay ? gEvent.start.date : gEvent.start.dateTime,
    endDate: isAllDay ? gEvent.end.date : gEvent.end.dateTime,

    // temp stuff to update
    priority: "self", // $$ TODO update
    // isTimeSelected: true,
    // isOpen: false,
    // order: 0,
    // groupOrder: 0,
    // groupCount: 0,
  };

  return compassEvent;
};

/* eslint-disable */
import { FC, PropsWithChildren, useRef } from "react";
import {
  DateFieldState,
  DateSegment as DateSegmentType,
  useCalendarState,
  useDateFieldState,
  useDatePickerState,
} from "react-stately";
import {
  DateFieldStateOptions,
  DatePickerStateOptions,
} from "@react-stately/datepicker";
import {
  DateValue,
  mergeProps,
  useButton,
  useCalendar,
  useCalendarCell,
  useCalendarGrid,
  useDateField,
  useDatePicker,
  useDateSegment,
  useFocusRing,
  useLocale,
} from "react-aria";
import {
  CalendarDate,
  createCalendar,
  getDayOfWeek,
  getWeeksInMonth,
  isSameDay,
} from "@internationalized/date";
import { Button, Flex, Popover } from "@radix-ui/themes";
import {
  CalendarState,
  CalendarStateOptions,
  RangeCalendarState,
} from "@react-stately/calendar";
import { AriaCalendarGridProps } from "@react-aria/calendar";
import { AriaButtonOptions } from "@react-aria/button";
import { ButtonProps } from "@radix-ui/themes/src/components/button";

export const CalendarButton: FC<
  PropsWithChildren<AriaButtonOptions<"button">>
> = (props) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(props, ref);
  const { focusProps, isFocusVisible } = useFocusRing();
  return (
    <Button
      {...(mergeProps(buttonProps, focusProps) as ButtonProps)}
      ref={ref}
      className={`p-2 rounded-full ${props.isDisabled ? "text-gray-400" : ""} ${
        !props.isDisabled ? "hover:bg-violet-100 active:bg-violet-200" : ""
      } outline-none ${
        isFocusVisible ? "ring-2 ring-offset-2 ring-purple-600" : ""
      }`}
    >
      {props.children}
    </Button>
  );
};

export const FieldButton: FC<PropsWithChildren<AriaButtonOptions<"button">>> = (
  props,
) => {
  const ref = useRef<HTMLButtonElement | null>(null);
  const { buttonProps, isPressed } = useButton(props, ref);
  return (
    <button {...buttonProps} ref={ref}>
      {props.children}
    </button>
  );
};

const DateSegment: FC<{ segment: DateSegmentType; state: DateFieldState }> = ({
  segment,
  state,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { segmentProps } = useDateSegment(segment, state, ref);

  return (
    <div
      {...segmentProps}
      ref={ref}
      style={{
        ...segmentProps.style,
        minWidth:
          segment.maxValue != null
            ? `${String(segment.maxValue).length}ch`
            : undefined,
      }}
      className={`px-0.5 box-content tabular-nums text-right outline-none rounded-sm focus:bg-violet-600 focus:text-white group ${
        !segment.isEditable ? "text-gray-500" : "text-gray-800"
      }`}
    >
      {/* Always reserve space for the placeholder, to prevent layout shift when editing. */}
      <span
        aria-hidden="true"
        className="block w-full text-center italic text-gray-500 group-focus:text-white"
        style={{
          visibility: segment.isPlaceholder ? undefined : "hidden",
          height: segment.isPlaceholder ? undefined : 0,
          pointerEvents: "none",
        }}
      >
        {segment.placeholder}
      </span>
      {segment.isPlaceholder ? "" : segment.text}
    </div>
  );
};

const DateField: FC<Partial<DateFieldStateOptions<DateValue>>> = (props) => {
  const { locale } = useLocale();
  const state = useDateFieldState({
    ...props,
    locale,
    createCalendar,
  });

  const ref = useRef<HTMLDivElement>(null);
  const { fieldProps } = useDateField(props, state, ref);

  return (
    <Flex
      align="center"
      {...fieldProps}
      ref={ref}
      className="rt-TextFieldRoot rt-r-size-2 rt-variant-surface"
    >
      {state.segments.map((segment, i) => (
        <DateSegment key={i} segment={segment} state={state} />
      ))}
    </Flex>
  );
};

export const CalendarCell: FC<{
  date: CalendarDate;
  state: CalendarState | RangeCalendarState;
}> = ({ state, date }) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    cellProps,
    buttonProps,
    isSelected,
    isOutsideVisibleRange,
    isDisabled,
    formattedDate,
    isInvalid,
  } = useCalendarCell({ date }, state, ref);

  // The start and end date of the selected range will have
  // an emphasized appearance.
  const isSelectionStart =
    "highlightedRange" in state && state.highlightedRange
      ? isSameDay(date, state.highlightedRange.start)
      : isSelected;
  const isSelectionEnd =
    "highlightedRange" in state && state.highlightedRange
      ? isSameDay(date, state.highlightedRange.end)
      : isSelected;

  // We add rounded corners on the left for the first day of the month,
  // the first day of each week, and the start date of the selection.
  // We add rounded corners on the right for the last day of the month,
  // the last day of each week, and the end date of the selection.
  const { locale } = useLocale();
  const dayOfWeek = getDayOfWeek(date, locale);
  const isRoundedLeft =
    isSelected && (isSelectionStart || dayOfWeek === 0 || date.day === 1);
  const isRoundedRight =
    isSelected &&
    (isSelectionEnd ||
      dayOfWeek === 6 ||
      date.day === date.calendar.getDaysInMonth(date));

  const { focusProps, isFocusVisible } = useFocusRing();

  return (
    <td
      {...cellProps}
      className={`py-0.5 relative ${isFocusVisible ? "z-10" : "z-0"}`}
    >
      <div
        {...mergeProps(buttonProps, focusProps)}
        ref={ref}
        hidden={isOutsideVisibleRange}
        className={`w-10 h-10 outline-none group ${
          isRoundedLeft ? "rounded-l-full" : ""
        } ${isRoundedRight ? "rounded-r-full" : ""} ${
          isSelected ? (isInvalid ? "bg-red-300" : "bg-violet-300") : ""
        } ${isDisabled ? "disabled" : ""}`}
      >
        <div
          className={`w-full h-full rounded-full flex items-center justify-center ${
            isDisabled && !isInvalid ? "text-gray-400" : ""
          } ${
            // Focus ring, visible while the cell has keyboard focus.
            isFocusVisible
              ? "ring-2 group-focus:z-2 ring-violet-600 ring-offset-2"
              : ""
          } ${
            // Darker selection background for the start and end.
            isSelectionStart || isSelectionEnd
              ? isInvalid
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-violet-600 text-white hover:bg-violet-700"
              : ""
          } ${
            // Hover state for cells in the middle of the range.
            isSelected && !isDisabled && !(isSelectionStart || isSelectionEnd)
              ? isInvalid
                ? "hover:bg-red-400"
                : "hover:bg-violet-400"
              : ""
          } ${
            // Hover state for non-selected cells.
            !isSelected && !isDisabled ? "hover:bg-violet-100" : ""
          } cursor-default`}
        >
          {formattedDate}
        </div>
      </div>
    </td>
  );
};

const CalendarGrid: FC<
  AriaCalendarGridProps & { state: CalendarState | RangeCalendarState }
> = ({ state, ...props }) => {
  const { locale } = useLocale();
  const { gridProps, headerProps, weekDays } = useCalendarGrid(props, state);

  // Get the number of weeks in the month so we can render the proper number of rows.
  const weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale);

  return (
    <table {...gridProps} cellPadding="0" className="flex-1">
      <thead {...headerProps} className="text-gray-600">
        <tr>
          {weekDays.map((day, index) => (
            <th className="text-center" key={index}>
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...new Array(weeksInMonth).keys()].map((weekIndex) => (
          <tr key={weekIndex}>
            {state
              .getDatesInWeek(weekIndex)
              .map((date, i) =>
                date ? (
                  <CalendarCell key={i} state={state} date={date} />
                ) : (
                  <td key={i} />
                ),
              )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const Calendar: FC<Partial<CalendarStateOptions<DateValue>>> = (props) => {
  const { locale } = useLocale();
  const state = useCalendarState({
    ...props,
    locale,
    createCalendar,
  });

  const ref = useRef<HTMLDivElement>(null);
  const { calendarProps, prevButtonProps, nextButtonProps, title } =
    useCalendar(props, state); // TODO ref?

  return (
    <div {...calendarProps} ref={ref} className="inline-block text-gray-800">
      <div className="flex items-center pb-4">
        <h2 className="flex-1 font-bold text-xl ml-2">{title}</h2>
        <CalendarButton {...prevButtonProps}>Left</CalendarButton>
        <CalendarButton {...nextButtonProps}>Right</CalendarButton>
      </div>
      <CalendarGrid state={state} />
    </div>
  );
};

export const DatePicker: FC<DatePickerStateOptions<DateValue>> = (props) => {
  const state = useDatePickerState(props);
  const ref = useRef<HTMLDivElement>(null);
  const { groupProps, labelProps, fieldProps, buttonProps, calendarProps } =
    useDatePicker(props, state, ref);

  return (
    <Popover.Root open={state.isOpen}>
      <div className="relative inline-flex flex-col text-left">
        <span {...labelProps} className="text-sm text-gray-800">
          {props.label}
        </span>
        <div {...groupProps} ref={ref} className="flex group">
          <div className="bg-white border border-gray-300 group-hover:border-gray-400 transition-colors rounded-l-md pr-10 group-focus-within:border-violet-600 group-focus-within:group-hover:border-violet-600 p-1 relative flex items-center">
            <DateField {...fieldProps} />
            {state.isInvalid && <>ExclamationIcon</>}
          </div>
          <Popover.Trigger>
            <div>
              <FieldButton {...buttonProps}>CalendarIcon</FieldButton>
            </div>
          </Popover.Trigger>
        </div>
        <Popover.Content>
          <Calendar {...calendarProps} />
        </Popover.Content>
      </div>
    </Popover.Root>
  );
};

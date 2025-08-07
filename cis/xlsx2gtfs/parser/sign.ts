import type { WorkSheet } from "xlsx";
import { extractDateRanges, type DateRange } from "../utils/time";

export enum StaticSign {
  WEEKDAYS_ONLY = "X",
  MONDAY_ONLY = "1",
  TUESDAY_ONLY = "2",
  WEDNESDAY_ONLY = "3",
  THURSDAY_ONLY = "4",
  FRIDAY_ONLY = "5",
  SATURDAY_ONLY = "6",
  SUNDAY_ONLY = "7",
  SUNDAYS_AND_HOLIDAYS = "+",
  REROUTED = "~",
  PASSED_STOP = "|",
  EXIT_ONLY_STOP = "(",
  ENTRY_ONLY_STOP = ")",
  WHEELCHAIR_ACCESSIBLE = "BB",
}

export enum SignType {
  STATIC = "static",
  OPERATES_ON = "operates",
  NOT_OPERATES_ON = "not_operates",
  OTHER = "other",
}

export interface SignExplanation {
  sign: string;
  type: SignType;
  description: string;
  dateRanges?: DateRange[];
  value?: string;
}

function parseExplanation(sign: string, explanation: string): SignExplanation {
  const staticSignValues = Object.values(StaticSign);
  if (staticSignValues.includes(sign as StaticSign)) {
    return {
      sign,
      type: SignType.STATIC,
      description: explanation,
      value: sign,
    };
  }

  if (explanation.startsWith("nejde od")) {
    return {
      sign,
      type: SignType.NOT_OPERATES_ON,
      description: explanation,
      dateRanges: extractDateRanges(explanation),
    };
  }

  if (explanation.startsWith("ide od")) {
    return {
      sign,
      type: SignType.OPERATES_ON,
      description: explanation,
      dateRanges: extractDateRanges(explanation),
    };
  }

  return {
    sign,
    type: SignType.OTHER,
    description: explanation,
  };
}

export function parseSignExplanations(sheet: WorkSheet): SignExplanation[] {
  let row = 4;
  const explanations: SignExplanation[] = [];

  while (sheet[`A${row}`]) {
    const sign = sheet[`A${row}`]?.v?.toString().trim();
    const explanation = sheet[`B${row}`]?.v?.toString().trim();

    if (sign && explanation) {
      explanations.push(parseExplanation(sign, explanation));
    }

    row++;
  }

  return explanations;
}

import httpStatus from "http-status";
import dayjs from "dayjs";
import { ApiError } from "../errors";
import { APIUsage } from "../models/APIUsage";

export const checkMonthlyLimit = async (steamid: string) => {
  const now = dayjs();
  let usage = await APIUsage.findOne({ steamid });

  const registered = usage ? dayjs(usage.lastReset) : now;

  // Get the current cycle start date (same day of month as registration)
  let currentCycleStart = registered
    .date(registered.date())
    .month(now.month())
    .year(now.year());

  // If today is before the cycle date this month, use the previous month
  if (now.isBefore(currentCycleStart)) {
    currentCycleStart = currentCycleStart.subtract(1, "month");
  }

  if (!usage) {
    usage = await APIUsage.create({
      steamid,
      count: 1,
      lastReset: currentCycleStart.toDate(),
    });
  }

  // If usage was last reset before this cycle, reset it
  if (dayjs(usage.lastReset).isBefore(currentCycleStart)) {
    usage.count = 1;
    usage.lastReset = currentCycleStart.toDate();
    await usage.save();
  }

  if (usage.count >= 30) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      "Monthly API limit reached."
    );
  }

  usage.count += 1;
  await usage.save();
};

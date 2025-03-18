/** 分未満を切り捨てる */
export const truncateUnderMin = (date: Date) => {
  // Invalid Date は例外を投げる
  if (Number.isNaN(date.valueOf())) {
    throw new Error("Invalid Date");
  }

  const newDate = new Date(date);

  newDate.setSeconds(0);
  newDate.setMilliseconds(0);

  return newDate;
};

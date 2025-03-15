/** 分未満を切り捨てる */
export const truncateUnderMin = (date: Date) => {
  const newDate = new Date(date);

  newDate.setSeconds(0);
  newDate.setMilliseconds(0);

  return newDate;
};

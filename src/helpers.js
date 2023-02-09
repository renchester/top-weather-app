export const convertDateToUTC = (date) =>
  new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );

export const getLocalTime = (offset, dateToConvert) => {
  let newDate;

  if (!dateToConvert) {
    newDate = new Date();
  } else {
    newDate = new Date(dateToConvert);
  }

  const dateUTC = convertDateToUTC(newDate);

  const convertedTime = +dateUTC + offset * 1000;
  const convertedDate = new Date(convertedTime);

  const year = convertedDate.getFullYear();
  const month = convertedDate.getMonth();
  const date = convertedDate.getDate();
  const hour = convertedDate.getHours();
  const minute = convertedDate.getMinutes();
  const second = convertedDate.getSeconds();

  return [year, month, date, hour, minute, second];
};

export const isDay = function (timeOfDay, day1, day2) {
  const [sunrise1, sunset1] = day1;
  const [sunrise2, sunset2] = day2;

  if (
    (timeOfDay >= sunrise1 && timeOfDay <= sunset1) ||
    (timeOfDay >= sunrise2 && timeOfDay <= sunset2)
  ) {
    return 'day';
  }
  return 'night';
};

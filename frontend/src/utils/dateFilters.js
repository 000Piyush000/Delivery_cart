export const getSafeDate = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const formatInputDate = (value) => {
  const parsedDate = getSafeDate(value);

  if (!parsedDate) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const matchesSelectedDate = (value, selectedDate) => {
  if (!selectedDate) {
    return true;
  }

  return formatInputDate(value) === selectedDate;
};

export const buildMonthlyBuckets = (items, getDateValue) => {
  const bucketMap = items.reduce((accumulator, item) => {
    const parsedDate = getSafeDate(getDateValue(item));

    if (!parsedDate) {
      return accumulator;
    }

    const key = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
    const existingBucket = accumulator.get(key);

    if (existingBucket) {
      existingBucket.count += 1;
      return accumulator;
    }

    accumulator.set(key, {
      key,
      count: 1,
      label: parsedDate.toLocaleString([], { month: "short", year: "numeric" })
    });

    return accumulator;
  }, new Map());

  return Array.from(bucketMap.values()).sort((left, right) => right.key.localeCompare(left.key));
};

export const formatSelectedDateLabel = (selectedDate) => {
  if (!selectedDate) {
    return "All dates";
  }

  const parsedDate = getSafeDate(selectedDate);
  return parsedDate
    ? parsedDate.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "All dates";
};

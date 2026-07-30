export const buildNoticeQuery = ({ role, classIds = [] }) => {
  const filters = [];

  if (role) {
    filters.push({
      $or: [
        { targetRoles: { $exists: false } },
        { targetRoles: { $size: 0 } },
        { targetRoles: role },
      ],
    });
  }

  if (classIds.length) {
    filters.push({
      $or: [
        { targetClassIds: { $exists: false } },
        { targetClassIds: { $size: 0 } },
        { targetClassIds: { $in: classIds } },
      ],
    });
  } else {
    filters.push({
      $or: [
        { targetClassIds: { $exists: false } },
        { targetClassIds: { $size: 0 } },
      ],
    });
  }

  if (!filters.length) return {};
  return { $and: filters };
};

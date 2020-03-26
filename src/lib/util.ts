export const getUserId = () => {
  return localStorage.userId || ''
}

export const rid = () => {
  const ridInLs = localStorage.rid
  if (ridInLs) {
    return ridInLs
  } else {
    const rid = Math.random()
      .toString(16)
      .slice(2)
    localStorage.rid = rid
    return rid
  }
}

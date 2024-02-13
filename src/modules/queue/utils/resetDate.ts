export const resetDate = (date: Date) => {
    date.setHours(0,0,0,0)
    date.setDate(1)
    return date
}
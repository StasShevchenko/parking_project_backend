export const getZeroTimezoneDate = (date: Date): Date => {
    const timezoneOffset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - timezoneOffset)
}
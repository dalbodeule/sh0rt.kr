const getDate = (day: number = 7, hours: number = 0, minutes: number = 0): Date => {
    const date = new Date()
    date.setDate(date.getDate() + day)
    date.setHours(hours, minutes, 0, 0)

    return date
}

export default getDate
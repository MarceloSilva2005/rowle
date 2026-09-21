package com.rowle.data

import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import kotlinx.datetime.toLocalDateTime

fun today(): LocalDate =
    Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date

fun formatEventWhen(date: LocalDate, time: LocalTime): String {
    val timeLabel = time.toString().take(5)
    return "${dateLabel(date)} • $timeLabel"
}

fun dateLabel(date: LocalDate): String {
    val t = today()
    val tomorrow = t.plus(1, DateTimeUnit.DAY)
    val (saturday, sunday) = thisWeekend(t)
    return when (date) {
        t -> "Hoje"
        tomorrow -> "Amanhã"
        saturday -> "Sábado"
        sunday -> "Domingo"
        else -> "${date.day} ${monthAbbr(date.monthNumber)}"
    }
}

fun isToday(date: LocalDate): Boolean = date == today()

fun isTomorrow(date: LocalDate): Boolean = date == today().plus(1, DateTimeUnit.DAY)

fun isThisWeekend(date: LocalDate): Boolean {
    val (saturday, sunday) = thisWeekend(today())
    return date == saturday || date == sunday
}

fun weekTitle(from: LocalDate = today()): String {
    val daysFromMonday = from.dayOfWeek.ordinal
    val monday = from.minus(daysFromMonday, DateTimeUnit.DAY)
    val sunday = monday.plus(6, DateTimeUnit.DAY)
    val startMonth = monthAbbr(monday.monthNumber)
    val endMonth = monthAbbr(sunday.monthNumber)
    return if (monday.monthNumber == sunday.monthNumber) {
        "${monday.day}–${sunday.day} $startMonth"
    } else {
        "${monday.day} $startMonth – ${sunday.day} $endMonth"
    }.uppercase()
}

fun thisWeekend(from: LocalDate = today()): Pair<LocalDate, LocalDate> {
    return when (from.dayOfWeek) {
        DayOfWeek.SATURDAY -> from to from.plus(1, DateTimeUnit.DAY)
        DayOfWeek.SUNDAY -> from.minus(1, DateTimeUnit.DAY) to from
        else -> {
            var saturday = from
            while (saturday.dayOfWeek != DayOfWeek.SATURDAY) {
                saturday = saturday.plus(1, DateTimeUnit.DAY)
            }
            saturday to saturday.plus(1, DateTimeUnit.DAY)
        }
    }
}

fun nextSaturday(from: LocalDate = today()): LocalDate {
    var date = from
    while (date.dayOfWeek != DayOfWeek.SATURDAY) {
        date = date.plus(1, DateTimeUnit.DAY)
    }
    return date
}

fun nextSunday(from: LocalDate = today()): LocalDate {
    var date = from
    while (date.dayOfWeek != DayOfWeek.SUNDAY) {
        date = date.plus(1, DateTimeUnit.DAY)
    }
    return date
}

private fun monthAbbr(month: Int): String = when (month) {
    1 -> "jan"
    2 -> "fev"
    3 -> "mar"
    4 -> "abr"
    5 -> "mai"
    6 -> "jun"
    7 -> "jul"
    8 -> "ago"
    9 -> "set"
    10 -> "out"
    11 -> "nov"
    else -> "dez"
}

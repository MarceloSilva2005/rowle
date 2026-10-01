package com.rowle.data

import com.rowle.model.Event

fun venueQuery(location: String): String {
    val place = location.trim()
    val lower = place.lowercase()
    val hasCity = "brasília" in lower || "brasilia" in lower
    return if (hasCity) place else "$place, Brasília"
}

fun mapsSearchUrl(location: String): String =
    "https://www.google.com/maps/search/?api=1&query=${encodeQuery(venueQuery(location))}"

fun calendarNote(event: Event): String = buildString {
    appendLine(event.location)
    append("A fonte marca o começo às ")
    append(event.time.hour.toString().padStart(2, '0'))
    append(':')
    append(event.time.minute.toString().padStart(2, '0'))
    appendLine(". O fim não está escrito.")
    val url = event.link
    if (!url.isNullOrBlank()) appendLine(url)
    append("Rowlê — Brasília")
}

fun calendarPageUrl(event: Event): String {
    val stamp = calendarStamp(event)
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=${encodeQuery(event.title)}" +
        "&dates=$stamp/$stamp" +
        "&location=${encodeQuery(event.location)}" +
        "&details=${encodeQuery(calendarNote(event))}"
}

private fun calendarStamp(event: Event): String {
    val date = event.date
    val time = event.time
    return date.year.toString().padStart(4, '0') +
        date.monthNumber.toString().padStart(2, '0') +
        date.dayOfMonth.toString().padStart(2, '0') +
        "T" +
        time.hour.toString().padStart(2, '0') +
        time.minute.toString().padStart(2, '0') +
        "00"
}

internal fun encodeQuery(value: String): String = buildString {
    value.encodeToByteArray().forEach { byte ->
        val b = byte.toInt() and 0xFF
        val ch = b.toChar()
        if (ch.isLetterOrDigit() || ch == '-' || ch == '_' || ch == '.' || ch == '~') {
            append(ch)
        } else {
            append('%')
            append(b.toString(16).uppercase().padStart(2, '0'))
        }
    }
}

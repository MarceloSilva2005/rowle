package com.rowle.ui

import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime

sealed interface AppScreen {
    data object Home : AppScreen
    data class EventDetail(
        val eventId: String,
        val date: LocalDate? = null,
        val time: LocalTime? = null
    ) : AppScreen
}

package com.rowle.ui

sealed interface AppScreen {
    data object Home : AppScreen
    data class EventDetail(val eventId: String) : AppScreen
    data object Settings : AppScreen
}
